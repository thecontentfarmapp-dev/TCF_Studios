import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import type { SeasonStatus } from '@/lib/supabase/types'

const SEASON_ORDER = ['development', 'pre_production', 'production', 'post', 'distribution', 'complete']

function seasonProgress(status: SeasonStatus) {
  return Math.round(((SEASON_ORDER.indexOf(status) + 1) / SEASON_ORDER.length) * 100)
}

function statusColor(status: SeasonStatus) {
  const map: Record<SeasonStatus, string> = {
    development: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    pre_production: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    production: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    post: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    distribution: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    complete: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  }
  return map[status]
}

export default async function SeasonsPage() {
  const supabase = await createClient()
  const { data: seasons } = await supabase
    .from('seasons')
    .select('*, creators(name), brands(company_name)')
    .order('created_at', { ascending: false })

  const active = seasons?.filter(s => s.status !== 'complete') || []
  const complete = seasons?.filter(s => s.status === 'complete') || []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Seasons</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{seasons?.length || 0} total · {active.length} active</p>
        </div>
        <Link
          href="/admin/seasons/new"
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + New season
        </Link>
      </div>

      {active.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Active</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {active.map(season => (
              <Link key={season.id} href={`/admin/seasons/${season.id}`}>
                <div className="p-4 rounded-xl border border-border hover:border-primary/30 bg-card transition-colors cursor-pointer space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{season.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(season.creators as { name: string } | null)?.name || 'No creator'}
                        {(season.brands as { company_name: string } | null)?.company_name && ` · ${(season.brands as { company_name: string }).company_name}`}
                      </p>
                    </div>
                    <Badge className={`text-xs border flex-shrink-0 ${statusColor(season.status as SeasonStatus)}`}>
                      {season.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{season.format || 'Format TBD'}</span>
                      <span>{season.episode_count} eps</span>
                    </div>
                    <Progress value={seasonProgress(season.status as SeasonStatus)} className="h-1.5" />
                    <p className="text-xs text-muted-foreground text-right">{seasonProgress(season.status as SeasonStatus)}%</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {complete.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Complete</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {complete.map(season => (
              <Link key={season.id} href={`/admin/seasons/${season.id}`}>
                <div className="p-4 rounded-xl border border-border hover:border-primary/30 bg-card transition-colors cursor-pointer opacity-60 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{season.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{(season.creators as { name: string } | null)?.name}</p>
                    </div>
                    <Badge className="text-xs border bg-zinc-500/15 text-zinc-400 border-zinc-500/30">Complete</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{season.episode_count} episodes · {season.wrapped_at ? `Wrapped ${new Date(season.wrapped_at).toLocaleDateString()}` : ''}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {(!seasons || seasons.length === 0) && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <p className="text-sm">No seasons yet</p>
        </div>
      )}
    </div>
  )
}
