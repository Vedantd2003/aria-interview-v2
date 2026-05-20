'use client'

import { create } from 'zustand'
import type { VapiTranscriptMessage, VapiDifficulty, VapiRole } from '@/types/vapi'

type CallStatus = 'idle' | 'connecting' | 'active' | 'ending' | 'ended'

interface InterviewStore {
  interviewId: string | null
  callStatus: CallStatus
  isSpeaking: boolean
  volumeLevel: number
  transcript: VapiTranscriptMessage[]
  elapsedSeconds: number
  role: VapiRole | null
  difficulty: VapiDifficulty | null
  duration: number

  setInterviewId: (id: string) => void
  setCallStatus: (status: CallStatus) => void
  setIsSpeaking: (speaking: boolean) => void
  setVolumeLevel: (level: number) => void
  addTranscriptMessage: (msg: VapiTranscriptMessage) => void
  setElapsedSeconds: (s: number) => void
  setConfig: (role: VapiRole, difficulty: VapiDifficulty, duration: number) => void
  reset: () => void
}

const initialState = {
  interviewId: null,
  callStatus: 'idle' as CallStatus,
  isSpeaking: false,
  volumeLevel: 0,
  transcript: [],
  elapsedSeconds: 0,
  role: null,
  difficulty: null,
  duration: 20,
}

export const useInterviewStore = create<InterviewStore>((set) => ({
  ...initialState,
  setInterviewId: (id) => set({ interviewId: id }),
  setCallStatus: (status) => set({ callStatus: status }),
  setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),
  setVolumeLevel: (level) => set({ volumeLevel: level }),
  addTranscriptMessage: (msg) =>
    set((state) => ({ transcript: [...state.transcript, msg] })),
  setElapsedSeconds: (s) => set({ elapsedSeconds: s }),
  setConfig: (role, difficulty, duration) => set({ role, difficulty, duration }),
  reset: () => set(initialState),
}))
