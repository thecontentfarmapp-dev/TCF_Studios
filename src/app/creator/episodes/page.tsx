import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

const PHASE_ORDER = ['commissioning', 'development', 'pre_production', 'production', 'post', 'distribution', 'publishing', 'evaluation']

function phaseProgress(phase: string) {
  return Math.round(((PHASE_ORDER.indexOf(phase) + 1) / PHASE_ORDER.length) * 100)
}

function phaseColor(phase: string) {
  const map: Record<string, string> = {
    commissioning: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    development: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    pre_production: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    production: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    post: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    distribution: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    publishing: 'bg-green-500/15 text-green-400 border-green-500/30',
    evaluation: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  }
  return map[phase] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
}

export default async function CreatorEpisodesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('creator_id').eq('id', user.id).single()
  if (!profile?.creator_id) redirect('/login')

  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, title, episodes(id, number, title, phase, due_date, published_at)')
    .eq('creator_id', profile.creator_id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Episodes</h1>
        <p className="text-muted-foreground mt-1">Track every episode through production to publish</p>
      </div>

      {seasons?.map(season => (
        <div key={season.id} className="space-y-4">
          <h2 className="text-lg font-semibold">{season.title}</h2>
          <div className="space-y-2">
            {(season.episodes as { id: string; number: number; title: string | null; phase: string; due_date: string | null; published_at: string | null }[])
              ?.sort((a, b) => a.number - b.number)
              .map(ep => (
                <div key={ep.id} className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-muted-foreground font-mono text-sm flex-shrink-0">{String(ep.number).padStart(2, '0')}</span>
                      <p className="font-medium truncate">{ep.title || `Episode ${ep.number}`}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={`text-xs border ${phaseColor(ep.phase)}`}>{ep.phase.replace('_', ' ')}</Badge>
                      {ep.published_at && (
                        <Badge className="text-xs border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Published</Badge>
                      )}
                    </div>
                  </div>
                  <Progress value={phaseProgress(ep.phase)} className="h-1" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Commissioning</span>
                    {ep.due_date && <span>Due {new Date(ep.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>}
                    <span>Published</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      {(!seasons || seasons.length === 0) && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No episodes yet
        </div>
      )}
    </div>
  )
}
