import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listInterviews } from '@/actions/interviews'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { capitalize } from '@/lib/utils'
import { Mic, Clock, ChevronRight, Plus } from 'lucide-react'

const statusColor: Record<string, string> = {
  pending:     '#9A9AA8',
  in_progress: '#EAB308',
  completed:   '#10B981',
  failed:      '#F43F5E',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const interviews = await listInterviews()
  const completed = interviews.filter(i => i.status === 'completed').length

  return (
    <main className="min-h-screen p-6 md:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Hey, {profile?.name?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {completed} interview{completed !== 1 ? 's' : ''} completed
          </p>
        </div>
        <Link href="/interview/new">
          <Button style={{ background: 'var(--accent-gradient)' }} className="gap-2">
            <Plus className="w-4 h-4" /> New Interview
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total',     value: interviews.length },
          { label: 'Completed', value: completed },
          { label: 'In Progress', value: interviews.filter(i => i.status === 'in_progress').length },
          { label: 'This Week', value: interviews.filter(i => {
            const d = new Date(i.created_at ?? '')
            const now = new Date()
            return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000
          }).length },
        ].map(stat => (
          <div key={stat.label} className="card-elevated p-5">
            <p className="text-3xl font-bold gradient-text">{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent interviews */}
      <section>
        <h2 className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>
          RECENT INTERVIEWS
        </h2>

        {interviews.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <Mic className="w-10 h-10 mx-auto mb-4 opacity-30" />
            <p className="font-medium mb-1">No interviews yet</p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Start your first mock interview to get AI-powered feedback
            </p>
            <Link href="/interview/new">
              <Button style={{ background: 'var(--accent-gradient)' }}>Start Interview</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {interviews.map(interview => (
              <Link key={interview.id} href={`/feedback/${interview.id}`}
                className="card-elevated p-5 flex items-center justify-between hover:border-violet-500/30 transition-colors group block">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--bg-glass)' }}>
                    <Mic className="w-4 h-4" style={{ color: 'var(--accent-violet)' }} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{capitalize(interview.role)}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">
                        {capitalize(interview.difficulty)}
                      </Badge>
                      <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        <Clock className="w-3 h-3" /> {interview.duration}min
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium" style={{ color: statusColor[interview.status] }}>
                    {capitalize(interview.status)}
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--text-secondary)' }} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
