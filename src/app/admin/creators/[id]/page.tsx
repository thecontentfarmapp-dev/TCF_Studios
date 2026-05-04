import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, AtSign, Mail, Phone } from 'lucide-react'
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

function phaseColor(status: string) {
  const map: Record<string, string> = {
    development: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    pre_production: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    production: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    post: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    distribution: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    complete: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  }
  return map[status] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
}

function formatAudience(n: number | null) {
  if (!n) return '—'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return n.toString()
}

export default async function CreatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: creator }, { data: seasons }] = await Promise.all([
    supabase.from('creators').select('*').eq('id', id).single(),
    supabase.from('seasons').select('*, brands(company_name)').eq('creator_id', id).order('created_at', { ascending: false }),
  ])

  if (!creator) notFound()

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/creators" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{creator.name}</h1>
            <Badge className={`text-xs border ${statusColor(creator.status as CreatorStatus)}`}>
              {creator.status.replace('_', ' ')}
            </Badge>
            {creator.slot && (
              <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{creator.slot}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">{creator.niche || 'No niche set'} · {formatAudience(creator.audience_size)} audience</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info card */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <h3 className="text-sm font-semibold">Contact</h3>
            <div className="space-y-2">
              <a href={`mailto:${creator.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="w-3.5 h-3.5" />{creator.email}
              </a>
              {creator.phone && (
                <a href={`tel:${creator.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Phone className="w-3.5 h-3.5" />{creator.phone}
                </a>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <h3 className="text-sm font-semibold">Social handles</h3>
            <div className="space-y-2 text-sm">
              {creator.instagram_handle && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AtSign className="w-3.5 h-3.5" />
                  <span>{creator.instagram_handle} (IG)</span>
                </div>
              )}
              {creator.tiktok_handle && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-3.5 h-3.5 text-xs font-bold flex items-center justify-center">TK</span>
                  <span>{creator.tiktok_handle}</span>
                </div>
              )}
              {!creator.instagram_handle && !creator.tiktok_handle && (
                <p className="text-muted-foreground">No handles added</p>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <h3 className="text-sm font-semibold">Deal</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Deal memo</span>
              <span className={creator.deal_memo_signed ? 'text-emerald-400' : 'text-muted-foreground'}>
                {creator.deal_memo_signed ? 'Signed' : 'Not signed'}
              </span>
            </div>
          </div>

          {creator.notes && (
            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <h3 className="text-sm font-semibold">Scouting notes</h3>
              <p className="text-sm text-muted-foreground">{creator.notes}</p>
            </div>
          )}
        </div>

        {/* Seasons */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="font-semibold">Seasons ({seasons?.length || 0})</h2>
          {seasons?.map(season => (
            <Link key={season.id} href={`/admin/seasons/${season.id}`}>
              <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors space-y-2 mb-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{season.title}</p>
                  <Badge className={`text-xs border ${phaseColor(season.status)}`}>{season.status.replace('_', ' ')}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {(season.brands as { company_name: string } | null)?.company_name || 'No brand'} · {season.episode_count} episodes
                </p>
                {season.format && <p className="text-xs text-muted-foreground">{season.format}</p>}
              </div>
            </Link>
          ))}
          {(!seasons || seasons.length === 0) && (
            <div className="p-6 rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
              No seasons yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
