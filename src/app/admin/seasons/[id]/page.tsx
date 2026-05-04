import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { ArrowLeft, Calendar, Film } from 'lucide-react'
import type { EpisodePhase, SeasonStatus } from '@/lib/supabase/types'
import SeasonAiDirectorButton from '@/components/admin/SeasonAiDirectorButton'

const PHASE_ORDER: EpisodePhase[] = ['commissioning', 'development', 'pre_production', 'production', 'post', 'distribution', 'publishing', 'evaluation']
const SEASON_ORDER: SeasonStatus[] = ['development', 'pre_production', 'production', 'post', 'distribution', 'complete']

function phaseProgress(phase: EpisodePhase) {
  return Math.round(((PHASE_ORDER.indexOf(phase) + 1) / PHASE_ORDER.length) * 100)
}

function seasonProgress(status: SeasonStatus) {
  return Math.round(((SEASON_ORDER.indexOf(status) + 1) / SEASON_ORDER.length) * 100)
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

export default async function SeasonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: season }, { data: episodes }, { data: shoots }] = await Promise.all([
    supabase.from('seasons').select('*, creators(name, instagram_handle, tiktok_handle), brands(company_name)').eq('id', id).single(),
    supabase.from('episodes').select('*, scripts(id, status, version)').eq('season_id', id).order('number', { ascending: true }),
    supabase.from('shoot_days').select('*').eq('season_id', id).order('date', { ascending: true }),
  ])

  if (!season) notFound()

  const phaseGroups = episodes ? PHASE_ORDER.reduce((acc, phase) => {
    const eps = episodes.filter(e => e.phase === phase)
    if (eps.length > 0) acc.push({ phase, episodes: eps })
    return acc
  }, [] as { phase: string, episodes: typeof episodes }[]) : []

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/seasons" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{season.title}</h1>
            <Badge className={`text-xs border ${phaseColor(season.status)}`}>{season.status.replace('_', ' ')}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {(season.creators as any)?.name || 'No creator'}
            {(season.brands as any)?.company_name && ` · ${(season.brands as any).company_name}`}
          </p>
        </div>
        <SeasonAiDirectorButton
          seasonId={id}
          seasonTitle={season.title}
          episodeCount={season.episode_count}
          showBible={season.show_bible}
        />
      </div>

      {/* Season progress */}
      <div className="p-4 rounded-xl border border-border bg-card space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{season.format || 'Format TBD'}</span>
          <span className="text-muted-foreground">{season.episode_count} episodes</span>
        </div>
        <Progress value={seasonProgress(season.status as SeasonStatus)} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Development</span>
          <span>Complete</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Episodes */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold">Episodes ({episodes?.length || 0})</h2>
          {phaseGroups.map(({ phase, episodes: eps }) => (
            <div key={phase} className="space-y-1.5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                {phase.replace('_', ' ')} ({eps.length})
              </h3>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border">
                    {eps.map(ep => {
                      const latestScript = ep.scripts?.sort((a: { version: number }, b: { version: number }) => b.version - a.version)[0]
                      return (
                        <tr key={ep.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-2.5 w-8 text-muted-foreground font-mono text-xs">{ep.number}</td>
                          <td className="px-3 py-2.5">
                            <Link href={`/admin/episodes/${ep.id}`} className="hover:text-primary transition-colors font-medium">
                              {ep.title || `Episode ${ep.number}`}
                            </Link>
                            {ep.logline && <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">{ep.logline}</p>}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground">
                            {ep.due_date ? new Date(ep.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—'}
                          </td>
                          <td className="px-3 py-2.5">
                            {latestScript && (
                              <Badge className={`text-xs border ${phaseColor(latestScript.status)}`}>
                                v{latestScript.version} · {latestScript.status.replace('_', ' ')}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {(!episodes || episodes.length === 0) && (
            <p className="text-sm text-muted-foreground">No episodes yet</p>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Shoot days */}
          <div className="space-y-3">
            <h2 className="font-semibold">Shoot Days ({shoots?.length || 0})</h2>
            {shoots?.map(shoot => (
              <div key={shoot.id} className="p-3 rounded-lg border border-border bg-card space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{new Date(shoot.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  <Badge className={`text-xs border ${shoot.status === 'complete' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : shoot.status === 'cancelled' ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-blue-500/15 text-blue-400 border-blue-500/30'}`}>
                    {shoot.status}
                  </Badge>
                </div>
                {shoot.call_time && <p className="text-xs text-muted-foreground">Call: {shoot.call_time}</p>}
                {shoot.location_name && <p className="text-xs text-muted-foreground">{shoot.location_name}</p>}
              </div>
            ))}
            {(!shoots || shoots.length === 0) && <p className="text-sm text-muted-foreground">No shoots scheduled</p>}
          </div>

          {/* Show bible */}
          {season.show_bible && (
            <div className="space-y-2">
              <h2 className="font-semibold">Show Bible</h2>
              <div className="p-3 rounded-lg border border-border bg-card">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{season.show_bible}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
