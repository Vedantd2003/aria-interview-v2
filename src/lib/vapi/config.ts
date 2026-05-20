import type { VapiRole, VapiDifficulty } from '@/types/vapi'

const VAPI_ASSISTANT_ID = '154874c3-1c39-4841-a6b5-8f2dcff7b9bf'

const ROLE_CHECKLISTS: Record<VapiRole, string> = {
  frontend:      'HTML/CSS fundamentals, JavaScript & TypeScript, React patterns, performance, accessibility, build tooling',
  backend:       'API design & REST/GraphQL, databases & SQL, caching, authentication, scalability, message queues',
  fullstack:     'End-to-end architecture, frontend + backend integration, databases, deployment, tradeoffs across the stack',
  system_design: 'Scalability, load balancing, databases at scale, CDN/caching, microservices, CAP theorem, real-world system design',
  behavioral:    'STAR method responses, leadership, conflict resolution, growth mindset, team collaboration, impact storytelling',
  dsa:           'Arrays & strings, trees & graphs, dynamic programming, sorting & searching, time/space complexity analysis',
}

export function buildAssistantOverrides(params: {
  role: VapiRole
  difficulty: VapiDifficulty
  duration: number
  userName: string
  resumeContext?: string
  deployedUrl: string
  webhookSecret: string
}) {
  const { role, difficulty, duration, userName, resumeContext, deployedUrl, webhookSecret } = params

  const systemPrompt = `You are ARIA, a senior ${role.replace('_', ' ')} interviewer at a top tech company.
You are interviewing ${userName}.${resumeContext ? ` Context about the candidate: ${resumeContext}` : ''}
Conduct a ${difficulty} ${role.replace('_', ' ')} interview lasting about ${duration} minutes.
Ask one question at a time. Listen fully before responding.
Ask 1-2 follow-up questions per question to probe depth.
Cover: ${ROLE_CHECKLISTS[role]}.
Stay professional, encouraging, but rigorous.
Around ${duration - 1} minutes in, wrap up briefly and end the call.`

  return {
    assistantId: VAPI_ASSISTANT_ID,
    assistantOverrides: {
      model: {
        provider: 'openai' as const,
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 250,
        messages: [{ role: 'system' as const, content: systemPrompt }],
      },
      firstMessage: `Hi ${userName}, I'm ARIA. Before we begin, take a moment to settle in. When you're ready, just say hello and we'll get started.`,
      maxDurationSeconds: duration * 60,
      silenceTimeoutSeconds: 30,
      serverUrl: `${deployedUrl}/api/vapi/webhook`,
      serverUrlSecret: webhookSecret,
    },
  }
}

// Keep old export name for API route compatibility
export { buildAssistantOverrides as buildAssistantConfig }
