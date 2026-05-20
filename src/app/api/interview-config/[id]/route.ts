import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildAssistantConfig } from '@/lib/vapi/config'
import type { VapiRole, VapiDifficulty } from '@/types/vapi'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: interview } = await supabase
    .from('interviews')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!interview) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, resume_text')
    .eq('id', user.id)
    .single()

  const deployedUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const config = buildAssistantConfig({
    role:          interview.role as VapiRole,
    difficulty:    interview.difficulty as VapiDifficulty,
    duration:      interview.duration,
    userName:      profile?.name ?? user.email?.split('@')[0] ?? 'there',
    resumeContext: profile?.resume_text ?? undefined,
    interviewId:   interview.id,
    deployedUrl,
    webhookSecret: process.env.VAPI_WEBHOOK_SECRET!,
  })

  return NextResponse.json({ config })
}
