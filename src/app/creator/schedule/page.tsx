import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Calendar } from 'lucide-react'

export default async function CreatorSchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('creator_id').eq('id', user.id).single()
  if (!profile?.creator_id) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  const { data: shoots } = await supabase
    .from('shoot_days')
    .select('*, seasons(title, creator_id)')
    .order('date', { ascending: true })

  const myShoots = shoots?.filter(s => (s.seasons as any)?.creator_id === profile.creator_id) || []
  const upcoming = myShoots.filter(s => s.date >= today && s.status === 'scheduled')
  const past = myShoots.filter(s => s.date < today || s.status !== 'scheduled')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Shoot Schedule</h1>
        <p className="text-muted-foreground mt-1">Your upcoming shoot days</p>
      </div>

      {upcoming.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-2">
          <Calendar className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No shoots scheduled — TCF will update this when dates are confirmed</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Upcoming</h2>
          {upcoming.map(shoot => {
            const d = new Date(shoot.date)
            const isToday = shoot.date === today
            return (
              <div key={shoot.id} className={`rounded-2xl border p-6 space-y-4 ${isToday ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
                <div className="flex items-start gap-5">
                  <div className="text-center min-w-[60px] flex-shrink-0">
                    <p className="text-xs text-muted-foreground uppercase font-medium">{d.toLocaleDateString('en', { month: 'short' })}</p>
                    <p className="text-4xl font-bold leading-none mt-0.5">{d.getDate()}</p>
                    <p className="text-sm text-muted-foreground">{d.toLocaleDateString('en', { weekday: 'short' })}</p>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-lg">{(shoot.seasons as { title: string } | null)?.title}</p>
                        {isToday && <Badge className="text-xs border bg-primary/15 text-primary border-primary/30">Today</Badge>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-5">
                      {shoot.call_time && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Call time</p>
                            <p className="font-semibold text-foreground">{shoot.call_time}</p>
                          </div>
                        </div>
                      )}
                      {shoot.location_name && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Location</p>
                            <p className="font-semibold text-foreground">{shoot.location_name}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {shoot.location_notes && (
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">{shoot.location_notes}</p>
                    )}
                    {shoot.shot_list && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Shot list</p>
                        <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">{shoot.shot_list}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Past shoots</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {past.map(shoot => (
                  <tr key={shoot.id} className="opacity-60">
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(shoot.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">{(shoot.seasons as { title: string } | null)?.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{shoot.location_name || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs border ${shoot.status === 'complete' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'}`}>
                        {shoot.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
