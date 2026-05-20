'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { buildAssistantConfig } from '@/lib/vapi/config'
import type { VapiRole, VapiDifficulty } from '@/types/vapi'

const createInterviewSchema = z.object({
  role:       z.enum(['frontend', 'backend', 'fullstack', 'system_design', 'behavioral', 'dsa']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  duration:   z.number().int().min(5).max(45),
})

export async function createInterview(input: unknown) {
  const parsed = createInterviewSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid input' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, resume_text')
    .eq('id', user.id)
    .single()

  const { data: interview, error } = await supabase
    .from('interviews')
    .insert({
      user_id:    user.id,
      role:       parsed.data.role,
      difficulty: parsed.data.difficulty,
      duration:   parsed.data.duration,
      status:     'pending',
    })
    .select()
    .single()

  if (error) return { error: 'Failed to create interview' }

  const deployedUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const config = buildAssistantConfig({
    role:          parsed.data.role as VapiRole,
    difficulty:    parsed.data.difficulty as VapiDifficulty,
    duration:      parsed.data.duration,
    userName:      profile?.name ?? user.email?.split('@')[0] ?? 'there',
    resumeContext: profile?.resume_text ?? undefined,
    interviewId:   interview.id,
    deployedUrl,
    webhookSecret: process.env.VAPI_WEBHOOK_SECRET!,
  })

  return { interviewId: interview.id, config }
}

export async function startInterview(interviewId: string, vapiCallId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase
    .from('interviews')
    .update({ status: 'in_progress', vapi_call_id: vapiCallId, started_at: new Date().toISOString() })
    .eq('id', interviewId)
    .eq('user_id', user.id)

  return { ok: true }
}

export async function endInterview(interviewId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase
    .from('interviews')
    .update({ status: 'completed', ended_at: new Date().toISOString() })
    .eq('id', interviewId)
    .eq('user_id', user.id)

  return { ok: true }
}

export async function getInterview(interviewId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('interviews')
    .select('*')
    .eq('id', interviewId)
    .eq('user_id', user.id)
    .single()

  return data
}

export async function listInterviews() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('interviews')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return data ?? []
}
