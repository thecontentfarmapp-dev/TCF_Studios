import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

function statusColor(status: string) {
  const map: Record<string, string> = {
    draft: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    in_review: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    creator_approved: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    brand_approved: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    locked: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    commissioning: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    development: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    pre_production: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    production: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    post: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    distribution: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    publishing: 'bg-green-500/15 text-green-400 border-green-500/30',
    evaluation: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  }
  return map[status] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
}

export default async function EpisodeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: episode }, { data: scripts }, { data: publishRecords }] = await Promise.all([
    supabase.from('episodes').select('*, seasons(id, title, creators(name), brands(company_name))').eq('id', id).single(),
    supabase.from('scripts').select('*').eq('episode_id', id).order('version', { ascending: false }),
    supabase.from('publish_records').select('*').eq('episode_id', id).order('published_at', { ascending: false }),
  ])

  if (!episode) notFound()

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href={`/admin/seasons/${episode.season_id}`} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">{(episode.seasons as { title: string } | null)?.title} · Ep {episode.number}</p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold tracking-tight">{episode.title || `Episode ${episode.number}`}</h1>
            <Badge className={`text-xs border ${statusColor(episode.phase)}`}>{episode.phase.replace('_', ' ')}</Badge>
          </div>
          {episode.logline && <p className="text-sm text-muted-foreground mt-1">{episode.logline}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scripts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Scripts ({scripts?.length || 0})</h2>
          </div>
          {scripts?.map(script => (
            <div key={script.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">Version {script.version}</span>
                  <Badge className={`text-xs border ${statusColor(script.status)}`}>{script.status.replace('_', ' ')}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(script.created_at).toLocaleDateString()}</span>
              </div>
              {script.content && (
                <div className="p-4">
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">{script.content}</pre>
                </div>
              )}
              <div className="px-4 py-3 border-t border-border bg-muted/20 flex gap-4 text-xs text-muted-foreground">
                {script.creator_approved_at && (
                  <span className="text-emerald-400">Creator approved {new Date(script.creator_approved_at).toLocaleDateString()}</span>
                )}
                {script.brand_approved_at && (
                  <span className="text-emerald-400">Brand approved {new Date(script.brand_approved_at).toLocaleDateString()}</span>
                )}
                {script.notes && <span className="text-amber-400">Note: {script.notes}</span>}
              </div>
            </div>
          ))}
          {(!scripts || scripts.length === 0) && (
            <div className="p-6 rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
              No scripts yet
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <h3 className="text-sm font-semibold">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due date</span>
                <span>{episode.due_date ? new Date(episode.due_date).toLocaleDateString() : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Publish date</span>
                <span>{episode.publish_date ? new Date(episode.publish_date).toLocaleDateString() : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Published</span>
                <span>{episode.published_at ? new Date(episode.published_at).toLocaleDateString() : 'Not yet'}</span>
              </div>
            </div>
          </div>

          {/* Publish records */}
          {publishRecords && publishRecords.length > 0 && (
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <h3 className="text-sm font-semibold">Published on</h3>
              {publishRecords.map(pr => (
                <div key={pr.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Badge className="text-xs border bg-zinc-500/15 text-zinc-400 border-zinc-500/30">
                      {pr.platform.replace('_', ' ')}
                    </Badge>
                    {pr.url && <a href={pr.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View</a>}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                    <span>{pr.views?.toLocaleString()} views</span>
                    <span>{pr.likes?.toLocaleString()} likes</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
