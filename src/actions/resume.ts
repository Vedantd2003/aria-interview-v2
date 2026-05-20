'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const uploadSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.enum([
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
})

export async function getResumeUploadUrl(input: unknown) {
  const parsed = uploadSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid file type' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const path = `${user.id}/${Date.now()}-${parsed.data.fileName}`

  const { data, error } = await supabase.storage
    .from('resumes')
    .createSignedUploadUrl(path)

  if (error) return { error: 'Failed to create upload URL' }
  return { signedUrl: data.signedUrl, path }
}

export async function saveResumeText(text: string) {
  if (!text || text.length > 50000) return { error: 'Invalid resume text' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({ resume_text: text.slice(0, 50000) })
    .eq('id', user.id)

  if (error) return { error: 'Failed to save resume' }
  return { ok: true }
}
