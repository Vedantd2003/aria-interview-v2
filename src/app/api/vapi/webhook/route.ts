import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { triggerFeedbackGeneration } from '@/actions/feedback'

function verifySignature(body: string, signature: string, secret: string): boolean {
  try {
    const expected = createHmac('sha256', secret).update(body).digest('hex')
    const expectedBuf = Buffer.from(`sha256=${expected}`)
    const receivedBuf = Buffer.from(signature)
    if (expectedBuf.length !== receivedBuf.length) return false
    return timingSafeEqual(expectedBuf, receivedBuf)
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-vapi-signature') ?? ''
  const secret = process.env.VAPI_WEBHOOK_SECRET ?? ''

  if (secret && !verifySignature(body, signature, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const message = payload.message as Record<string, unknown> | undefined
  const type = message?.type as string | undefined

  if (type === 'end-of-call-report') {
    const callId     = (message?.call as Record<string, unknown>)?.id as string | undefined
    const transcript = (message?.artifact as Record<string, unknown>)?.transcript as unknown[] | undefined
    const service    = createServiceClient()

    if (callId) {
      const { data: interview } = await service
        .from('interviews')
        .select('id')
        .eq('vapi_call_id', callId)
        .single()

      if (interview) {
        await service
          .from('interviews')
          .update({
            transcript: (transcript ?? []) as import('@/types/database').Database['public']['Tables']['interviews']['Update']['transcript'],
            status:     'completed',
            ended_at:   new Date().toISOString(),
          })
          .eq('id', interview.id)

        // Fire-and-forget feedback generation
        triggerFeedbackGeneration(interview.id).catch(console.error)
      }
    }
  }

  return NextResponse.json({ received: true })
}
