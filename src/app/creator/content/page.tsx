import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Eye, Heart, MessageCircle, Share2, TrendingUp } from 'lucide-react'

export default async function CreatorContentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('creator_id').eq('id', user.id).single()
  if (!profile?.creator_id) redirect('/login')

  const { data: records } = await supabase
    .from('publish_records')
    .select('*, episodes(number, title, season_id, seasons(title, creator_id))')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })

  const myRecords = records?.filter(r => {
    const ep = r.episodes as any
    return ep?.seasons?.creator_id === profile.creator_id
  }) || []

  const totalViews = myRecords.reduce((acc, r) => acc + (r.views || 0), 0)
  const totalLikes = myRecords.reduce((acc, r) => acc + (r.likes || 0), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Live Content</h1>
        <p className="text-muted-foreground mt-1">Your published episodes and performance</p>
      </div>

      {myRecords.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-2">
          <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No content published yet — your episodes will appear here once they go live</p>
        </div>
      )}

      {myRecords.length > 0 && (
        <>
          {/* Totals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Views', value: totalViews, icon: Eye, color: 'text-blue-400' },
              { label: 'Total Likes', value: totalLikes, icon: Heart, color: 'text-red-400' },
              { label: 'Episodes Live', value: myRecords.length, icon: TrendingUp, color: 'text-emerald-400' },
              { label: 'Avg Retention', value: myRecords.filter(r => r.retention_rate).length > 0 ? `${(myRecords.reduce((acc, r) => acc + (r.retention_rate || 0), 0) / myRecords.filter(r => r.retention_rate).length).toFixed(1)}%` : '—', icon: MessageCircle, color: 'text-violet-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
              </div>
            ))}
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {myRecords.map(r => {
              const ep = r.episodes as { number: number; title: string | null; seasons: { title: string } | null } | null
              return (
                <div key={r.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{ep?.seasons?.title} — Episode {ep?.number}</p>
                      <p className="text-sm text-muted-foreground">{ep?.title || 'Untitled'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className="text-xs border bg-zinc-500/15 text-zinc-400 border-zinc-500/30">
                        {r.platform.replace('_', ' ')}
                      </Badge>
                      {r.url && (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                          View post
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <div className="grid grid-cols-4 gap-4 text-center">
                      {[
                        { label: 'Views', value: r.views || 0, icon: Eye },
                        { label: 'Likes', value: r.likes || 0, icon: Heart },
                        { label: 'Comments', value: r.comments || 0, icon: MessageCircle },
                        { label: 'Shares', value: r.shares || 0, icon: Share2 },
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label}>
                          <p className="text-xl font-bold">{value.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                    {r.retention_rate && (
                      <div className="mt-4 pt-4 border-t border-border flex justify-between text-sm">
                        <span className="text-muted-foreground">Retention rate</span>
                        <span className="font-semibold">{r.retention_rate}%</span>
                      </div>
                    )}
                  </div>
                  <div className="px-5 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
                    Published {r.published_at ? new Date(r.published_at).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                    {r.last_synced_at && <span> · Stats synced {new Date(r.last_synced_at).toLocaleDateString()}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
