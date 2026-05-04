import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import CreatorScriptApproval from '@/components/creator/CreatorScriptApproval'

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

export default async function CreatorScriptsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('creator_id').eq('id', user.id).single()
  if (!profile?.creator_id) redirect('/login')

  const { data: scripts } = await supabase
    .from('scripts')
    .select('*, episodes(number, title, season_id, seasons(title, creator_id))')
    .order('updated_at', { ascending: false })

  const myScripts = scripts?.filter(s => {
    const ep = s.episodes as any
    return ep?.seasons?.creator_id === profile.creator_id
  }) || []

  const pending = myScripts.filter(s => s.status === 'in_review')
  const other = myScripts.filter(s => s.status !== 'in_review')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Scripts</h1>
        <p className="text-muted-foreground mt-1">Review and approve scripts for your episodes</p>
      </div>

      {pending.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">Needs Your Approval ({pending.length})</h2>
          {pending.map(script => {
            const ep = script.episodes as { number: number; title: string | null; seasons: { title: string } | null } | null
            return (
              <div key={script.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
                <div className="px-5 py-4 border-b border-amber-500/10 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{ep?.seasons?.title} — Episode {ep?.number}: {ep?.title || 'Untitled'}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Version {script.version}</p>
                  </div>
                  <Badge className="text-xs border bg-amber-500/15 text-amber-400 border-amber-500/30">Needs approval</Badge>
                </div>
                {script.content && (
                  <div className="px-5 py-4">
                    <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{script.content}</pre>
                  </div>
                )}
                {script.notes && (
                  <div className="px-5 py-3 bg-blue-500/10 border-t border-blue-500/10">
                    <p className="text-sm text-blue-300"><span className="font-medium">Notes from TCF:</span> {script.notes}</p>
                  </div>
                )}
                <div className="px-5 py-4 border-t border-border">
                  <CreatorScriptApproval scriptId={script.id} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {pending.length === 0 && (
        <div className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center">
          <p className="text-emerald-400 font-medium">All caught up — no scripts pending your approval</p>
        </div>
      )}

      {other.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">All Scripts</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Episode</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Version</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {other.map(script => {
                  const ep = script.episodes as { number: number; title: string | null; seasons: { title: string } | null } | null
                  return (
                    <tr key={script.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{ep?.seasons?.title} — Ep {ep?.number}</p>
                        <p className="text-xs text-muted-foreground">{ep?.title || 'Untitled'}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">v{script.version}</td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs border ${statusColor(script.status)}`}>{script.status.replace('_', ' ')}</Badge>
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
    </div>
  )
}
