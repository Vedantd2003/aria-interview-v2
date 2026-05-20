export type VapiRole = 'frontend' | 'backend' | 'fullstack' | 'system_design' | 'behavioral' | 'dsa'
export type VapiDifficulty = 'easy' | 'medium' | 'hard'

export interface VapiTranscriptMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

export interface VapiAssistantConfig {
  model: {
    provider: string
    model: string
    temperature: number
    maxTokens: number
    messages: { role: string; content: string }[]
  }
  voice: {
    provider: string
    voiceId: string
    model: string
    stability: number
    similarityBoost: number
    optimizeStreamingLatency: number
  }
  transcriber: {
    provider: string
    model: string
    language: string
    smartFormat: boolean
    endpointing: number
  }
  firstMessage: string
  firstMessageMode: string
  maxDurationSeconds: number
  silenceTimeoutSeconds: number
  backgroundSound: string
  backchannelingEnabled: boolean
  serverUrl: string
  serverUrlSecret: string
}

export interface FeedbackScores {
  technical: number
  communication: number
  confidence: number
  problem_solving: number
  overall: number
}
