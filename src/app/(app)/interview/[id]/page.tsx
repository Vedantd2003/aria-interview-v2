'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { getVapi, destroyVapi } from '@/lib/vapi/client'
import { createInterview, startInterview, endInterview } from '@/actions/interviews'
import { useInterviewStore } from '@/stores/interview-store'
import { Transcript } from '@/components/interview/Transcript'
import { Button } from '@/components/ui/button'
import { formatDuration } from '@/lib/utils'
import { Mic, MicOff, PhoneOff, Loader2 } from 'lucide-react'
import { triggerFeedbackGeneration } from '@/actions/feedback'

const VoiceOrb = dynamic(
  () => import('@/components/interview/VoiceOrb').then(m => m.VoiceOrb),
  { ssr: false }
)

export default function InterviewRoomPage() {
  const router   = useRouter()
  const { id }   = useParams<{ id: string }>()
  const store    = useInterviewStore()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [muted, setMuted] = useState(false)
  const [configReady, setConfigReady] = useState(false)

  useEffect(() => {
    store.setInterviewId(id)
    store.setCallStatus('connecting')

    async function init() {
      // The config was built when creating the interview; fetch it fresh
      const res = await fetch(`/api/interview-config/${id}`)
      if (!res.ok) {
        toast.error('Failed to load interview config')
        store.setCallStatus('idle')
        return
      }
      const { config } = await res.json()

      const vapi = getVapi()

      vapi.on('call-start', async () => {
        store.setCallStatus('active')
        const callId = (vapi as unknown as { callId?: string }).callId ?? ''
        await startInterview(id, callId)
        let secs = 0
        timerRef.current = setInterval(() => {
          secs += 1
          store.setElapsedSeconds(secs)
        }, 1000)
      })

      vapi.on('speech-start', () => store.setIsSpeaking(true))
      vapi.on('speech-end',   () => store.setIsSpeaking(false))

      vapi.on('volume-level', (level: number) => store.setVolumeLevel(level))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vapi.on('message', (msg: any) => {
        if (msg?.type === 'transcript' && msg?.transcriptType === 'final') {
          store.addTranscriptMessage({ role: msg.role, content: msg.transcript })
        }
      })

      vapi.on('call-end', async () => {
        store.setCallStatus('ending')
        if (timerRef.current) clearInterval(timerRef.current)
        await endInterview(id)
        const { feedbackId } = await triggerFeedbackGeneration(id)
        router.push(`/feedback/${id}`)
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vapi.on('error', (err: any) => {
        console.error('Vapi error:', err)
        toast.error('Connection issue — please try again')
        store.setCallStatus('idle')
      })

      // Use assistantId + overrides (avoids 403 from inline assistant creation)
      await vapi.start(config.assistantId, config.assistantOverrides)
      setConfigReady(true)
    }

    init()

    return () => {
      destroyVapi()
      if (timerRef.current) clearInterval(timerRef.current)
      store.reset()
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleMute() {
    const vapi = getVapi()
    const newMuted = !muted
    setMuted(newMuted)
    vapi.setMuted(newMuted)
  }

  async function handleEndCall() {
    store.setCallStatus('ending')
    destroyVapi()
    await endInterview(id)
    const { feedbackId } = await triggerFeedbackGeneration(id)
    router.push(`/feedback/${id}`)
  }

  const isConnecting = store.callStatus === 'connecting'
  const isEnding     = store.callStatus === 'ending'

  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-6 md:p-10"
      style={{ background: 'radial-gradient(ellipse at center, #0E0E14 0%, #07070B 70%)' }}>

      {/* Top bar */}
      <div className="w-full max-w-2xl flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {isConnecting ? 'Connecting…' : isEnding ? 'Wrapping up…' : 'Interview in progress'}
        </span>
        <span className="font-mono text-sm tabular-nums" style={{ color: 'var(--accent-cyan)' }}>
          {formatDuration(store.elapsedSeconds)}
        </span>
      </div>

      {/* Orb */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-4">
        {isConnecting || isEnding ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-16 h-16 animate-spin" style={{ color: 'var(--accent-violet)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {isConnecting ? 'Starting your interview…' : 'Generating feedback…'}
            </p>
          </div>
        ) : (
          <>
            <VoiceOrb isSpeaking={store.isSpeaking} volumeLevel={store.volumeLevel} size={260} />
            <p className="text-sm transition-colors duration-300"
              style={{ color: store.isSpeaking ? 'var(--accent-violet)' : 'var(--text-secondary)' }}>
              {store.isSpeaking ? 'ARIA is speaking…' : 'Listening…'}
            </p>
          </>
        )}
      </motion.div>

      {/* Transcript */}
      <div className="w-full max-w-2xl">
        <div className="card-elevated p-4 mb-4 min-h-32">
          <Transcript messages={store.transcript} />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline" size="icon"
            onClick={toggleMute}
            className="w-12 h-12 rounded-full"
            style={{ borderColor: muted ? 'var(--danger)' : 'var(--border-subtle)' }}
            disabled={isConnecting || isEnding}>
            {muted ? <MicOff className="w-5 h-5" style={{ color: 'var(--danger)' }} />
                   : <Mic    className="w-5 h-5" />}
          </Button>
          <Button
            size="icon"
            onClick={handleEndCall}
            className="w-14 h-14 rounded-full"
            style={{ background: 'var(--danger)' }}
            disabled={isConnecting || isEnding}>
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </main>
  )
}
