import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { listInterviews } from '@/actions/interviews'
import { Badge } from '@/components/ui/badge'
import { capitalize } from '@/lib/utils'
import { Clock, ChevronRight } from 'lucide-react'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const interviews = await listInterviews()

  return (
    <main className="min-h-screen p-6 md:p-10 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-8">Interview History</h1>

      {interviews.length === 0 ? (
        <div className="card-elevated p-12 text-center">
          <p style={{ color: 'var(--text-secondary)' }}>No interviews yet.</p>
          <Link href="/interview/new" className="mt-4 inline-block"
            style={{ color: 'var(--accent-violet)' }}>
            Start your first →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map(i => (
            <Link key={i.id} href={`/feedback/${i.id}`}
              className="card-elevated p-5 flex items-center justify-between hover:border-violet-500/30 transition-colors group block">
              <div>
                <p className="font-medium text-sm">{capitalize(i.role)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{capitalize(i.difficulty)}</Badge>
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                    <Clock className="w-3 h-3" />{i.duration}min
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(i.created_at ?? '').toLocaleDateString()}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--text-secondary)' }} />
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
