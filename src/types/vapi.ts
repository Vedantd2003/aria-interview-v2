export type VapiRole = 'frontend' | 'backend' | 'fullstack' | 'system_design' | 'behavioral' | 'dsa'
export type VapiDifficulty = 'easy' | 'medium' | 'hard'

export interface VapiTranscriptMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

export interface VapiStartPayload {
  assistantId: string
  assistantOverrides: {
    model: {
      provider: 'openai'
      model: string
      temperature: number
      maxTokens: number
      messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
    }
    firstMessage: string
    maxDurationSeconds: number
    silenceTimeoutSeconds: number
    serverUrl: string
    serverUrlSecret: string
  }
}

// Legacy alias kept for import compatibility
export type VapiAssistantConfig = VapiStartPayload

export interface FeedbackScores {
  technical: number
  communication: number
  confidence: number
  problem_solving: number
  overall: number
}
