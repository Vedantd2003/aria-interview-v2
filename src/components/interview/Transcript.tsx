'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { VapiTranscriptMessage } from '@/types/vapi'

interface TranscriptProps {
  messages: VapiTranscriptMessage[]
}

export function Transcript({ messages }: TranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Transcript will appear here…
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 overflow-y-auto pr-1 max-h-80">
      <AnimatePresence initial={false}>
        {messages.map((msg, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
              style={{
                background: msg.role === 'assistant' ? 'var(--accent-gradient)' : 'var(--bg-glass)',
                border:     '1px solid var(--border-subtle)',
              }}>
              {msg.role === 'assistant' ? 'A' : 'Y'}
            </div>
            <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm"
              style={{
                background: msg.role === 'assistant' ? 'var(--bg-elevated)' : 'rgba(139,92,246,0.15)',
                border:     '1px solid var(--border-subtle)',
                color:      'var(--text-primary)',
              }}>
              {msg.content}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  )
}
