import OpenAI from 'openai'
import type { VapiRole, VapiDifficulty, FeedbackScores } from '@/types/vapi'

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
})

export interface FeedbackResult {
  scores: FeedbackScores
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  summary: string
}

const feedbackSchema = {
  type: 'object',
  properties: {
    scores: {
      type: 'object',
      properties: {
        technical:       { type: 'integer', minimum: 0, maximum: 100 },
        communication:   { type: 'integer', minimum: 0, maximum: 100 },
        confidence:      { type: 'integer', minimum: 0, maximum: 100 },
        problem_solving: { type: 'integer', minimum: 0, maximum: 100 },
        overall:         { type: 'integer', minimum: 0, maximum: 100 },
      },
      required: ['technical', 'communication', 'confidence', 'problem_solving', 'overall'],
      additionalProperties: false,
    },
    strengths:   { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 5 },
    weaknesses:  { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 5 },
    suggestions: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 5 },
    summary:     { type: 'string' },
  },
  required: ['scores', 'strengths', 'weaknesses', 'suggestions', 'summary'],
  additionalProperties: false,
}

export async function generateFeedback(params: {
  transcript: { role: string; content: string }[]
  role: VapiRole
  difficulty: VapiDifficulty
}): Promise<FeedbackResult> {
  const { transcript, role, difficulty } = params

  const transcriptText = transcript
    .map((m) => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
    .join('\n')

  const response = await client.chat.completions.create({
    model: 'openai/gpt-4o-mini',
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'interview_feedback', strict: true, schema: feedbackSchema },
    },
    messages: [
      {
        role: 'system',
        content: `You are an expert interview coach evaluating a candidate's ${difficulty} ${role.replace('_', ' ')} mock interview. Score them strictly but fairly (0-100). Be specific — cite examples from the transcript. Avoid generic feedback. The summary should be 2-3 sentences.`,
      },
      {
        role: 'user',
        content: `Interview transcript:\n\n${transcriptText}`,
      },
    ],
  })

  const raw = response.choices[0]?.message?.content
  if (!raw) throw new Error('No feedback content from model')
  return JSON.parse(raw) as FeedbackResult
}
