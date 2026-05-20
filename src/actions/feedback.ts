'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { generateFeedback } from '@/lib/openai/feedback'
import type { VapiRole, VapiDifficulty } from '@/types/vapi'

export async function triggerFeedbackGeneration(interviewId: string) {
  const service = createServiceClient()

  const { data: interview } = await service
    .from('interviews')
    .select('*')
    .eq('id', interviewId)
    .single()

  if (!interview) return { error: 'Interview not found' }

  const transcript = (interview.transcript as { role: string; content: string }[]) ?? []
  if (transcript.length === 0) return { error: 'No transcript available' }

  const existing = await service
    .from('feedback')
    .select('id')
    .eq('interview_id', interviewId)
    .single()

  if (existing.data) return { feedbackId: existing.data.id }

  const result = await generateFeedback({
    transcript,
    role:       interview.role as VapiRole,
    difficulty: interview.difficulty as VapiDifficulty,
  })

  const { data: feedback, error } = await service
    .from('feedback')
    .insert({
      interview_id: interviewId,
      user_id:      interview.user_id,
      scores:       result.scores as unknown as import('@/types/database').Database['public']['Tables']['feedback']['Insert']['scores'],
      strengths:    result.strengths,
      weaknesses:   result.weaknesses,
      suggestions:  result.suggestions,
      summary:      result.summary,
    })
    .select()
    .single()

  if (error) return { error: 'Failed to save feedback' }
  return { feedbackId: feedback.id }
}

export async function getFeedback(interviewId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('feedback')
    .select('*, interviews(role, difficulty, duration, ended_at)')
    .eq('interview_id', interviewId)
    .eq('user_id', user.id)
    .single()

  return data
}
