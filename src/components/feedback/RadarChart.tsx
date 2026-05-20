'use client'

import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts'
import type { FeedbackScores } from '@/types/vapi'

interface Props { scores: FeedbackScores }

export function ScoreRadarChart({ scores }: Props) {
  const data = [
    { subject: 'Technical',       value: scores.technical },
    { subject: 'Communication',   value: scores.communication },
    { subject: 'Confidence',      value: scores.confidence },
    { subject: 'Problem Solving', value: scores.problem_solving },
    { subject: 'Overall',         value: scores.overall },
  ]

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#9A9AA8', fontSize: 12 }} />
        <Radar dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.25}
          dot={{ fill: '#8B5CF6', strokeWidth: 0, r: 3 }} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
