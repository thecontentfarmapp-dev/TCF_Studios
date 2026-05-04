import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { EpisodePhase } from '@/lib/supabase/types'

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

function scriptStatusColor(status: string) {
  const map: Record<string, string> = {
    draft: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    in_review: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    creator_approved: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    brand_approved: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    locked: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  }
  return map[status] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
}

export default async function EpisodesPage() {
  const supabase = await createClient()
  const { data: episodes } = await supabase
    .from('episodes')
    .select('*, seasons(title, brands(company_name), creators(name)), scripts(id, version, status)')
    .order('seasons(title)', { ascending: true })
    .order('number', { ascending: true })

  const isOverdue = (ep: { due_date: string | null, phase: EpisodePhase }) => {
    if (!ep.due_date) return false
    if (['publishing', 'evaluation'].includes(ep.phase)) return false
    return new Date(ep.due_date) < new Date()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Episodes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{episodes?.length || 0} total</p>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Season</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-10">#</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phase</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Script</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {episodes?.map(ep => {
              const latestScript = ep.scripts?.sort((a: { version: number }, b: { version: number }) => b.version - a.version)[0]
              const overdue = isOverdue({ due_date: ep.due_date, phase: ep.phase as EpisodePhase })
              return (
                <tr key={ep.id} className={`hover:bg-muted/30 transition-colors ${overdue ? 'bg-red-500/5' : ''}`}>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[150px]">
                    <Link href={`/admin/seasons/${ep.season_id}`} className="hover:text-foreground truncate block">
                      {(ep.seasons as { title: string } | null)?.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{ep.number}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/episodes/${ep.id}`} className="hover:text-primary transition-colors font-medium">
                      {ep.title || `Episode ${ep.number}`}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs border ${phaseColor(ep.phase)}`}>{ep.phase.replace('_', ' ')}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {latestScript ? (
                      <Badge className={`text-xs border ${scriptStatusColor(latestScript.status)}`}>
                        v{latestScript.version} · {latestScript.status.replace('_', ' ')}
                      </Badge>
                    ) : <span className="text-xs text-muted-foreground">No script</span>}
                  </td>
                  <td className="px-4 py-3">
                    {ep.due_date ? (
                      <span className={`text-xs ${overdue ? 'text-red-400 font-medium' : 'text-muted-foreground'}`}>
                        {overdue ? 'Overdue · ' : ''}{new Date(ep.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </span>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {(!episodes || episodes.length === 0) && (
          <div className="p-8 text-center text-sm text-muted-foreground">No episodes yet</div>
        )}
      </div>
    </div>
  )
}
