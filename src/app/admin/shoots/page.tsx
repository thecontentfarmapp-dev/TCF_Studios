import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { MapPin, Clock } from 'lucide-react'

function statusColor(status: string) {
  const map: Record<string, string> = {
    scheduled: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    complete: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
  }
  return map[status] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
}

export default async function ShootsPage() {
  const supabase = await createClient()
  const { data: shoots } = await supabase
    .from('shoot_days')
    .select('*, seasons(id, title, creators(name))')
    .order('date', { ascending: true })

  const today = new Date().toISOString().split('T')[0]
  const upcoming = shoots?.filter(s => s.date >= today && s.status === 'scheduled') || []
  const past = shoots?.filter(s => s.date < today || s.status !== 'scheduled') || []

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shoot Days</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{upcoming.length} upcoming · {past.length} past</p>
        </div>
      </div>

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Upcoming</h2>
          <div className="space-y-3">
            {upcoming.map(shoot => {
              const d = new Date(shoot.date)
              const isToday = shoot.date === today
              return (
                <div key={shoot.id} className={`p-4 rounded-xl border transition-colors ${isToday ? 'border-blue-500/40 bg-blue-500/5' : 'border-border bg-card'}`}>
                  <div className="flex items-start gap-4">
                    <div className="text-center min-w-[52px] flex-shrink-0">
                      <p className="text-xs text-muted-foreground uppercase font-medium">{d.toLocaleDateString('en', { month: 'short' })}</p>
                      <p className="text-3xl font-bold leading-none mt-0.5">{d.getDate()}</p>
                      <p className="text-xs text-muted-foreground">{d.toLocaleDateString('en', { weekday: 'short' })}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{(shoot.seasons as { title: string } | null)?.title}</p>
                        {isToday && <Badge className="text-xs border bg-blue-500/15 text-blue-400 border-blue-500/30">Today</Badge>}
                        <Badge className={`text-xs border ${statusColor(shoot.status)}`}>{shoot.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{(shoot.seasons as { creators: { name: string } | null } | null)?.creators?.name}</p>
                      <div className="flex flex-wrap gap-4 mt-2">
                        {shoot.call_time && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Call {shoot.call_time}</span>
                          </div>
                        )}
                        {shoot.location_name && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{shoot.location_name}</span>
                          </div>
                        )}
                      </div>
                      {shoot.location_notes && (
                        <p className="text-xs text-muted-foreground mt-1.5">{shoot.location_notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Past</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {past.slice(0, 20).map(shoot => (
                  <tr key={shoot.id} className="hover:bg-muted/30 transition-colors opacity-70">
                    <td className="px-4 py-3 font-medium">{formatDate(shoot.date)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{(shoot.seasons as { title: string } | null)?.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{shoot.location_name || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs border ${statusColor(shoot.status)}`}>{shoot.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!shoots || shoots.length === 0) && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <p className="text-sm">No shoot days scheduled</p>
        </div>
      )}
    </div>
  )
}
