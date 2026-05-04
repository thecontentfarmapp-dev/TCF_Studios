import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { AtSign, Users } from 'lucide-react'
import type { CreatorStatus } from '@/lib/supabase/types'

function statusColor(status: CreatorStatus) {
  const map: Record<CreatorStatus, string> = {
    prospect: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    in_conversation: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    soft_commitment: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    signed: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    alumni: 'bg-zinc-600/15 text-zinc-500 border-zinc-600/30',
  }
  return map[status]
}

function formatAudience(n: number | null) {
  if (!n) return '—'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return n.toString()
}

export default async function CreatorsPage() {
  const supabase = await createClient()
  const { data: creators } = await supabase
    .from('creators')
    .select('*')
    .order('status', { ascending: true })
    .order('name', { ascending: true })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Creators</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{creators?.length || 0} total</p>
        </div>
        <Link
          href="/admin/creators/new"
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + New creator
        </Link>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Creator</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Niche</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Slot</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Audience</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Handles</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deal</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {creators?.map(creator => (
              <tr key={creator.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/admin/creators/${creator.id}`} className="hover:text-primary transition-colors">
                    <p className="font-medium">{creator.name}</p>
                    <p className="text-xs text-muted-foreground">{creator.email}</p>
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground capitalize">{creator.niche || '—'}</td>
                <td className="px-4 py-3">
                  {creator.slot ? (
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{creator.slot}</span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{formatAudience(creator.audience_size)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                    {creator.instagram_handle && <span>IG: {creator.instagram_handle}</span>}
                    {creator.tiktok_handle && <span>TK: {creator.tiktok_handle}</span>}
                    {!creator.instagram_handle && !creator.tiktok_handle && <span>—</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {creator.deal_memo_signed
                    ? <span className="text-xs text-emerald-400">Signed</span>
                    : <span className="text-xs text-muted-foreground">Pending</span>
                  }
                </td>
                <td className="px-4 py-3">
                  <Badge className={`text-xs border ${statusColor(creator.status as CreatorStatus)}`}>
                    {creator.status.replace('_', ' ')}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!creators || creators.length === 0) && (
          <div className="p-8 text-center text-sm text-muted-foreground">No creators yet</div>
        )}
      </div>
    </div>
  )
}
