import type { VapiRole, VapiDifficulty, VapiAssistantConfig } from '@/types/vapi'

const ROLE_CHECKLISTS: Record<VapiRole, string> = {
  frontend: 'HTML/CSS fundamentals, JavaScript & TypeScript, React patterns, performance optimization, accessibility, build tooling',
  backend: 'API design & REST/GraphQL, databases & SQL, caching strategies, authentication, scalability, message queues',
  fullstack: 'End-to-end architecture, frontend + backend integration, databases, deployment, tradeoffs across the stack',
  system_design: 'Scalability, load balancing, databases at scale, CDN/caching, microservices, CAP theorem, real-world system design',
  behavioral: 'STAR method responses, leadership, conflict resolution, growth mindset, team collaboration, impact storytelling',
  dsa: 'Arrays & strings, trees & graphs, dynamic programming, sorting & searching, time/space complexity analysis',
}

export function buildAssistantConfig(params: {
  role: VapiRole
  difficulty: VapiDifficulty
  duration: number
  userName: string
  resumeContext?: string
  interviewId: string
  deployedUrl: string
  webhookSecret: string
}): VapiAssistantConfig {
  const { role, difficulty, duration, userName, resumeContext, deployedUrl, webhookSecret } = params

  const systemPrompt = `You are ARIA, a senior ${role.replace('_', ' ')} interviewer at a top tech company.
You are interviewing ${userName}.${resumeContext ? ` Context about the candidate: ${resumeContext}` : ''}
Conduct a ${difficulty} ${role.replace('_', ' ')} interview lasting about ${duration} minutes.
Ask one question at a time. Listen fully before responding.
Ask 1-2 follow-up questions per question to probe depth.
Cover this checklist: ${ROLE_CHECKLISTS[role]}.
Stay professional, encouraging, but rigorous. Give brief acknowledgments.
Around ${duration - 1} minutes in, wrap up with a brief positive summary and end the call.`

  return {
    model: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 250,
      messages: [{ role: 'system', content: systemPrompt }],
    },
    voice: {
      provider: '11labs',
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah — warm, professional
      model: 'eleven_flash_v2_5',
      stability: 0.5,
      similarityBoost: 0.75,
      optimizeStreamingLatency: 3,
    },
    transcriber: {
      provider: 'deepgram',
      model: 'nova-3',
      language: 'en',
      smartFormat: true,
      endpointing: 150,
    },
    firstMessage: `Hi ${userName}, I'm ARIA. Before we begin, take a moment to settle in. When you're ready, just say hello and we'll get started.`,
    firstMessageMode: 'assistant-speaks-first',
    maxDurationSeconds: duration * 60,
    silenceTimeoutSeconds: 30,
    backgroundSound: 'office',
    backchannelingEnabled: true,
    serverUrl: `${deployedUrl}/api/vapi/webhook`,
    serverUrlSecret: webhookSecret,
  }
}
