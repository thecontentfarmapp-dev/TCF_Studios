import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Eye, Heart, MessageCircle, Share2 } from 'lucide-react'
import type { PublishRecord } from '@/lib/supabase/types'

type RecordRow = PublishRecord & {
  episodes: { number: number; title: string | null; seasons: { title: string } | null } | null
}

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const { data: rawRecords } = await supabase
    .from('publish_records')
    .select('*, episodes(number, title, season_id, seasons(title, creators(name)))')
    .order('published_at', { ascending: false })

  const records = (rawRecords ?? []) as RecordRow[]

  const totalViews = records.reduce((acc, r) => acc + (r.views || 0), 0)
  const totalLikes = records.reduce((acc, r) => acc + (r.likes || 0), 0)
  const totalComments = records.reduce((acc, r) => acc + (r.comments || 0), 0)
  const totalShares = records.reduce((acc, r) => acc + (r.shares || 0), 0)

  const byPlatform = records.reduce((acc, r) => {
    if (!acc[r.platform]) acc[r.platform] = { views: 0, likes: 0, count: 0 }
    acc[r.platform].views += r.views || 0
    acc[r.platform].likes += r.likes || 0
    acc[r.platform].count += 1
    return acc
  }, {} as Record<string, { views: number; likes: number; count: number }>)

  const stats = [
    { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-blue-400' },
    { label: 'Total Likes', value: totalLikes.toLocaleString(), icon: Heart, color: 'text-red-400' },
    { label: 'Total Comments', value: totalComments.toLocaleString(), icon: MessageCircle, color: 'text-violet-400' },
    { label: 'Total Shares', value: totalShares.toLocaleString(), icon: Share2, color: 'text-cyan-400' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{records.length} published posts tracked</p>
      </div>

      {records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-2">
          <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No published content yet — performance data will appear here once episodes are published and synced.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Object.entries(byPlatform).map(([platform, data]) => (
              <div key={platform} className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className="text-xs border bg-zinc-500/15 text-zinc-400 border-zinc-500/30">{platform.replace('_', ' ')}</Badge>
                  <span className="text-xs text-muted-foreground">{data.count} posts</span>
                </div>
                <div>
                  <p className="text-xl font-bold">{data.views.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">views</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold">Top Posts by Views</h2>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Episode</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Platform</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Views</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Likes</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Retention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...records].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 20).map(r => (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{r.episodes?.seasons?.title} — Ep {r.episodes?.number}</p>
                        <p className="text-xs text-muted-foreground">{r.episodes?.title || 'Untitled'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="text-xs border bg-zinc-500/15 text-zinc-400 border-zinc-500/30">{r.platform.replace('_', ' ')}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">{(r.views ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm">{(r.likes ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-sm">{r.retention_rate ? `${r.retention_rate}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
