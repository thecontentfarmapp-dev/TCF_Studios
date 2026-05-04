import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

function statusColor(status: string) {
  const map: Record<string, string> = {
    draft: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    in_review: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    creator_approved: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    brand_approved: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    locked: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  }
  return map[status] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
}

export default async function ScriptsPage() {
  const supabase = await createClient()
  const { data: scripts } = await supabase
    .from('scripts')
    .select('*, episodes(number, title, season_id, seasons(title, creators(name)))')
    .order('updated_at', { ascending: false })

  const pending = scripts?.filter(s => s.status === 'in_review') || []
  const other = scripts?.filter(s => s.status !== 'in_review') || []

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scripts</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {scripts?.length || 0} total · {pending.length} pending approval
        </p>
      </div>

      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">Needs Approval ({pending.length})</h2>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {pending.map(script => {
                  const ep = script.episodes as { number: number; title: string | null; season_id: string; seasons: { title: string; creators: { name: string } | null } | null } | null
                  return (
                    <tr key={script.id} className="hover:bg-amber-500/5 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/episodes/${script.episode_id}`} className="hover:text-primary transition-colors">
                          <p className="font-medium">{ep?.seasons?.title} — Ep {ep?.number}: {ep?.title || 'Untitled'}</p>
                          <p className="text-xs text-muted-foreground">{ep?.seasons?.creators?.name}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">v{script.version}</td>
                      <td className="px-4 py-3">
                        <Badge className="text-xs border bg-amber-500/15 text-amber-400 border-amber-500/30">In review</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(script.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">All Scripts</h2>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Episode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Version</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Approvals</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {scripts?.map(script => {
                const ep = script.episodes as { number: number; title: string | null; season_id: string; seasons: { title: string; creators: { name: string } | null } | null } | null
                return (
                  <tr key={script.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/episodes/${script.episode_id}`} className="hover:text-primary transition-colors">
                        <p className="font-medium text-sm">{ep?.seasons?.title} — Ep {ep?.number}</p>
                        <p className="text-xs text-muted-foreground">{ep?.title || 'Untitled'}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">v{script.version}</td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs border ${statusColor(script.status)}`}>{script.status.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {script.creator_approved_at && <span className="text-xs text-emerald-400">Creator</span>}
                        {script.brand_approved_at && <span className="text-xs text-emerald-400">Brand</span>}
                        {!script.creator_approved_at && !script.brand_approved_at && <span className="text-xs text-muted-foreground">None</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(script.updated_at).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {(!scripts || scripts.length === 0) && (
            <div className="p-8 text-center text-sm text-muted-foreground">No scripts yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
