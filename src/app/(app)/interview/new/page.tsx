'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { createInterview } from '@/actions/interviews'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { VapiRole, VapiDifficulty } from '@/types/vapi'
import { capitalize } from '@/lib/utils'

const ROLES: { value: VapiRole; label: string; icon: string }[] = [
  { value: 'frontend',      label: 'Frontend',        icon: '🎨' },
  { value: 'backend',       label: 'Backend',         icon: '⚙️' },
  { value: 'fullstack',     label: 'Full-Stack',      icon: '🔥' },
  { value: 'system_design', label: 'System Design',   icon: '🏗️' },
  { value: 'behavioral',    label: 'Behavioral',      icon: '🧠' },
  { value: 'dsa',           label: 'DSA',             icon: '📊' },
]

const DIFFICULTIES: VapiDifficulty[] = ['easy', 'medium', 'hard']
const DURATIONS = [10, 15, 20, 30, 45]

export default function NewInterviewPage() {
  const router = useRouter()
  const [role, setRole]           = useState<VapiRole>('fullstack')
  const [difficulty, setDifficulty] = useState<VapiDifficulty>('medium')
  const [duration, setDuration]   = useState(20)
  const [loading, setLoading]     = useState(false)

  async function handleStart() {
    setLoading(true)
    const result = await createInterview({ role, difficulty, duration })
    if ('error' in result) {
      toast.error(result.error)
      setLoading(false)
      return
    }
    router.push(`/interview/${result.interviewId}`)
  }

  const diffColor: Record<VapiDifficulty, string> = {
    easy:   '#10B981',
    medium: '#EAB308',
    hard:   '#F43F5E',
  }

  return (
    <main className="min-h-screen p-6 md:p-10 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>

        <h1 className="text-2xl font-semibold mb-1">Configure Interview</h1>
        <p className="text-sm mb-10" style={{ color: 'var(--text-secondary)' }}>
          ARIA will tailor questions to your selections
        </p>

        {/* Role */}
        <section className="mb-8">
          <p className="text-xs font-medium mb-3 tracking-widest" style={{ color: 'var(--text-secondary)' }}>
            ROLE
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ROLES.map(r => (
              <button key={r.value} onClick={() => setRole(r.value)}
                className="card-elevated p-4 text-left transition-all duration-200"
                style={{
                  borderColor: role === r.value ? 'var(--accent-violet)' : 'var(--border-subtle)',
                  boxShadow:   role === r.value ? '0 0 16px rgba(139,92,246,0.25)' : 'none',
                }}>
                <span className="text-2xl">{r.icon}</span>
                <p className="text-sm font-medium mt-2">{r.label}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Difficulty */}
        <section className="mb-8">
          <p className="text-xs font-medium mb-3 tracking-widest" style={{ color: 'var(--text-secondary)' }}>
            DIFFICULTY
          </p>
          <div className="flex gap-3">
            {DIFFICULTIES.map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                className="card-elevated px-5 py-3 text-sm font-medium transition-all duration-200"
                style={{
                  borderColor: difficulty === d ? diffColor[d] : 'var(--border-subtle)',
                  color:       difficulty === d ? diffColor[d] : 'var(--text-secondary)',
                  boxShadow:   difficulty === d ? `0 0 16px ${diffColor[d]}40` : 'none',
                }}>
                {capitalize(d)}
              </button>
            ))}
          </div>
        </section>

        {/* Duration */}
        <section className="mb-10">
          <p className="text-xs font-medium mb-3 tracking-widest" style={{ color: 'var(--text-secondary)' }}>
            DURATION
          </p>
          <div className="flex gap-3 flex-wrap">
            {DURATIONS.map(d => (
              <button key={d} onClick={() => setDuration(d)}
                className="card-elevated px-5 py-3 text-sm font-medium transition-all duration-200"
                style={{
                  borderColor: duration === d ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                  color:       duration === d ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  boxShadow:   duration === d ? '0 0 16px rgba(34,211,238,0.25)' : 'none',
                }}>
                {d}m
              </button>
            ))}
          </div>
        </section>

        {/* Summary + CTA */}
        <div className="card-elevated p-5 flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">{ROLES.find(r => r.value === role)?.label}</Badge>
            <Badge variant="outline" style={{ color: diffColor[difficulty] }}>{capitalize(difficulty)}</Badge>
            <Badge variant="outline">{duration} min</Badge>
          </div>
          <Button onClick={handleStart} disabled={loading} size="lg"
            style={{ background: 'var(--accent-gradient)' }}>
            {loading ? 'Starting…' : 'Start Interview →'}
          </Button>
        </div>
      </motion.div>
    </main>
  )
}
