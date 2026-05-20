'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getFeedback } from '@/actions/feedback'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { capitalize } from '@/lib/utils'
import { CheckCircle2, XCircle, Lightbulb, RotateCcw, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import type { FeedbackScores } from '@/types/vapi'

const ScoreRadarChart = dynamic(
  () => import('@/components/feedback/RadarChart').then(m => m.ScoreRadarChart),
  { ssr: false }
)

type FeedbackData = Awaited<ReturnType<typeof getFeedback>>

function ScoreRing({ value, label }: { value: number; label: string }) {
  const r    = 40
  const circ = 2 * Math.PI * r
  const dash = (value / 100) * circ

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none"
          stroke="url(#scoreGrad)" strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round" />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-2xl font-bold gradient-text" style={{ marginTop: -64 }}>{value}</span>
      <span className="text-xs mt-8" style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  )
}

export default function FeedbackPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const [data, setData]     = useState<FeedbackData | null>(null)
  const [polling, setPolling] = useState(true)

  const fetchFeedback = useCallback(async () => {
    const result = await getFeedback(id)
    if (result) {
      setData(result)
      setPolling(false)
    }
  }, [id])

  useEffect(() => {
    fetchFeedback()
    if (!data) {
      const interval = setInterval(fetchFeedback, 1500)
      const timeout  = setTimeout(() => { clearInterval(interval); setPolling(false) }, 30000)
      return () => { clearInterval(interval); clearTimeout(timeout) }
    }
  }, [fetchFeedback, data])

  async function copyShareLink() {
    await navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied!')
  }

  if (polling && !data) {
    return (
      <main className="min-h-screen p-6 md:p-10 max-w-4xl mx-auto">
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full mx-auto mb-6 animate-pulse"
            style={{ background: 'var(--accent-gradient)' }} />
          <p className="font-medium">Generating your feedback…</p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            ARIA is reviewing your interview
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Feedback not available yet.</p>
          <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </div>
      </main>
    )
  }

  const scores  = data.scores as unknown as FeedbackScores
  const interviewMeta = (data as { interviews?: { role: string; difficulty: string; duration: number } }).interviews

  const stagger = {
    container: { animate: { transition: { staggerChildren: 0.07 } } },
    item:      { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } },
  }

  return (
    <main className="min-h-screen p-6 md:p-10 max-w-4xl mx-auto">
      <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-6">

        {/* Header */}
        <motion.div variants={stagger.item} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Interview Feedback</h1>
            {interviewMeta && (
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {capitalize(interviewMeta.role)} · {capitalize(interviewMeta.difficulty)} · {interviewMeta.duration}min
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyShareLink} className="gap-2">
              <Share2 className="w-3.5 h-3.5" /> Share
            </Button>
            <Link href="/interview/new">
              <Button size="sm" style={{ background: 'var(--accent-gradient)' }} className="gap-2">
                <RotateCcw className="w-3.5 h-3.5" /> Retry
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Overall score hero */}
        <motion.div variants={stagger.item} className="card-elevated p-8">
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>PERFORMANCE SCORES</p>
          <div className="flex flex-wrap gap-8 justify-center md:justify-start">
            <ScoreRing value={scores.overall}         label="Overall" />
            <ScoreRing value={scores.technical}       label="Technical" />
            <ScoreRing value={scores.communication}   label="Communication" />
            <ScoreRing value={scores.confidence}      label="Confidence" />
            <ScoreRing value={scores.problem_solving} label="Problem Solving" />
          </div>
        </motion.div>

        {/* Radar + summary */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div variants={stagger.item} className="card-elevated p-6">
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>RADAR</p>
            <ScoreRadarChart scores={scores} />
          </motion.div>
          <motion.div variants={stagger.item} className="card-elevated p-6">
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>SUMMARY</p>
            <p className="text-sm leading-relaxed">{data.summary}</p>
          </motion.div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div variants={stagger.item} className="card-elevated p-6">
            <p className="text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} /> STRENGTHS
            </p>
            <ul className="space-y-3">
              {data.strengths.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                  {s}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div variants={stagger.item} className="card-elevated p-6">
            <p className="text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <XCircle className="w-4 h-4" style={{ color: 'var(--danger)' }} /> AREAS TO IMPROVE
            </p>
            <ul className="space-y-3">
              {data.weaknesses.map((w, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
                  {w}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Suggestions */}
        <motion.div variants={stagger.item} className="card-elevated p-6">
          <p className="text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <Lightbulb className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} /> ACTIONABLE SUGGESTIONS
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {data.suggestions.map((s, i) => (
              <div key={i} className="flex gap-3 p-4 rounded-xl text-sm"
                style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)' }}>
                <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-cyan)' }} />
                {s}
              </div>
            ))}
          </div>
        </motion.div>

      </motion.div>
    </main>
  )
}
