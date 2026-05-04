import { createClient } from '@/lib/supabase/server'
import { statusColor, formatDate, formatDateShort } from '@/lib/status'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ShotList from '@/components/admin/ShotList'

export default async function EpisodeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: episode }, { data: scripts }, { data: publishRecords }, { data: shots }] = await Promise.all([
    supabase.from('episodes').select('*, seasons(id, title, creators(name), brands(company_name))').eq('id', id).single(),
    supabase.from('scripts').select('*').eq('episode_id', id).order('version', { ascending: false }),
    supabase.from('publish_records').select('*').eq('episode_id', id).order('published_at', { ascending: false }),
    supabase.from('shots').select('*').eq('episode_id', id).order('number', { ascending: true }),
  ])

  if (!episode) notFound()

  const latestScript = scripts?.[0] ?? null

  return (
    <div className="p-6 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/admin/seasons/${episode.season_id}`} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <p className="text-sm text-muted-foreground">
            {(episode.seasons as any)?.title} · Episode {episode.number}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <h1 className="text-2xl font-bold tracking-tight">{episode.title || `Episode ${episode.number}`}</h1>
            <Badge className={`text-xs border ${statusColor(episode.phase)}`}>{episode.phase.replace(/_/g, ' ')}</Badge>
          </div>
          {episode.logline && <p className="text-sm text-muted-foreground mt-1">{episode.logline}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Shot list — main content */}
        <div className="xl:col-span-3">
          <ShotList
            episodeId={id}
            episodeTitle={episode.title || `Episode ${episode.number}`}
            script={latestScript?.content ?? null}
            initialShots={(shots ?? []) as any}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Episode details */}
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
                <span>{episode.published_at ? new Date(episode.published_at).toLocaleDateString() : '—'}</span>
              </div>
            </div>
          </div>

          {/* Scripts */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <h3 className="text-sm font-semibold">Scripts ({scripts?.length || 0})</h3>
            {scripts?.map(script => (
              <div key={script.id} className="space-y-1.5 pb-3 border-b border-border last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Version {script.version}</span>
                  <Badge className={`text-xs border ${statusColor(script.status)}`}>{script.status.replace(/_/g, ' ')}</Badge>
                </div>
                {script.content && (
                  <details className="group">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">View script</summary>
                    <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed bg-muted/30 rounded-lg p-3">
                      {script.content}
                    </pre>
                  </details>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {script.creator_approved_at && <span className="text-emerald-400">Creator ✓</span>}
                  {script.brand_approved_at && <span className="text-emerald-400">Brand ✓</span>}
                  {script.notes && <span className="text-amber-400 truncate">Note: {script.notes}</span>}
                </div>
              </div>
            ))}
            {(!scripts || scripts.length === 0) && <p className="text-sm text-muted-foreground">No scripts yet</p>}
          </div>

          {/* Publish records */}
          {publishRecords && publishRecords.length > 0 && (
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <h3 className="text-sm font-semibold">Published on</h3>
              {publishRecords.map(pr => (
                <div key={pr.id} className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <Badge className="text-xs border bg-zinc-500/15 text-zinc-400 border-zinc-500/30">
                      {pr.platform.replace(/_/g, ' ')}
                    </Badge>
                    {pr.url && (
                      <a href={pr.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View</a>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                    <span>{(pr.views ?? 0).toLocaleString()} views</span>
                    <span>{(pr.likes ?? 0).toLocaleString()} likes</span>
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
