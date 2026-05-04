import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { Calendar, FileText, Play } from 'lucide-react'

const SEASON_ORDER = ['development', 'pre_production', 'production', 'post', 'distribution', 'complete']

function seasonProgress(status: string) {
  return Math.round(((SEASON_ORDER.indexOf(status) + 1) / SEASON_ORDER.length) * 100)
}

export default async function CreatorOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('creator_id').eq('id', user.id).single()
  if (!profile?.creator_id) redirect('/login')

  const [{ data: seasons }, { data: shoots }, { data: pendingScripts }] = await Promise.all([
    supabase.from('seasons').select('*, brands(company_name), episodes(id, phase)').eq('creator_id', profile.creator_id).order('created_at', { ascending: false }),
    supabase.from('shoot_days').select('*, seasons(creator_id)')
      .gte('date', new Date().toISOString().split('T')[0])
      .eq('status', 'scheduled')
      .order('date', { ascending: true })
      .limit(3),
    supabase.from('scripts').select('id, episode_id, status, version, episodes(season_id, seasons(creator_id))').eq('status', 'in_review'),
  ])

  const myPendingScripts = pendingScripts?.filter(s => {
    const ep = s.episodes as any
    return ep?.seasons?.creator_id === profile.creator_id
  }) || []

  const myShoots = shoots?.filter(s => (s.seasons as any)?.creator_id === profile.creator_id) || []

  const activeSeason = seasons?.[0]

  return (
    <div className="space-y-8">
      {activeSeason && (
        <div className="relative rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-violet-900 via-blue-900 to-cyan-900 p-8 space-y-4">
            <div>
              <p className="text-violet-300 text-sm font-medium uppercase tracking-wider">Your Season</p>
              <h1 className="text-3xl font-bold mt-2">{activeSeason.title}</h1>
              {(activeSeason.brands as { company_name: string } | null)?.company_name && (
                <p className="text-blue-200 mt-1">In partnership with {(activeSeason.brands as { company_name: string }).company_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-blue-200">
                <span>{activeSeason.status.replace('_', ' ')}</span>
                <span>{activeSeason.episodes?.length || 0} episodes</span>
              </div>
              <Progress value={seasonProgress(activeSeason.status)} className="h-2 bg-white/20" />
            </div>
          </div>
        </div>
      )}

      {!activeSeason && (
        <div>
          <h1 className="text-2xl font-bold">Creator Portal</h1>
          <p className="text-muted-foreground mt-1">No active season assigned yet</p>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/creator/scripts" className="p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-medium">Scripts to review</p>
          </div>
          <p className="text-3xl font-bold">{myPendingScripts.length}</p>
          <p className="text-xs text-muted-foreground">awaiting your approval</p>
        </Link>

        <Link href="/creator/schedule" className="p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <p className="text-sm font-medium">Next shoot</p>
          </div>
          {myShoots[0] ? (
            <>
              <p className="text-xl font-bold">{new Date(myShoots[0].date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</p>
              <p className="text-xs text-muted-foreground">{myShoots[0].location_name || 'Location TBD'}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No shoots scheduled</p>
          )}
        </Link>

        <Link href="/creator/episodes" className="p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors space-y-2">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-cyan-400" />
            <p className="text-sm font-medium">Total episodes</p>
          </div>
          <p className="text-3xl font-bold">{seasons?.reduce((acc, s) => acc + (s.episodes?.length || 0), 0) || 0}</p>
          <p className="text-xs text-muted-foreground">in your season</p>
        </Link>
      </div>
    </div>
  )
}
