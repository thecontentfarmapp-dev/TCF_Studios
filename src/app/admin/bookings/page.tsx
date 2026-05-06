import { createClient } from '@/lib/supabase/server'
import { Video, Phone, Mail, Building2, Calendar, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const TIMEZONE = 'Australia/Sydney'

function formatDate(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleString('en-AU', { timeZone: TIMEZONE, ...opts })
}

function isoToDay(iso: string) {
  return formatDate(iso, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function isoToTime(iso: string) {
  return formatDate(iso, { hour: 'numeric', minute: '2-digit', hour12: true })
}

function isUpcoming(iso: string) {
  return new Date(iso) > new Date()
}

export default async function BookingsPage() {
  const supabase = await createClient()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .order('start_time', { ascending: true })

  const upcoming = bookings?.filter(b => isUpcoming(b.start_time)) ?? []
  const past = bookings?.filter(b => !isUpcoming(b.start_time)) ?? []

  // Group upcoming by day
  const grouped: Record<string, typeof upcoming> = {}
  for (const b of upcoming) {
    const day = isoToDay(b.start_time)
    if (!grouped[day]) grouped[day] = []
    grouped[day].push(b)
  }

  const today = isoToDay(new Date().toISOString())
  const tomorrow = isoToDay(new Date(Date.now() + 86400000).toISOString())

  function dayLabel(day: string) {
    if (day === today) return 'Today'
    if (day === tomorrow) return 'Tomorrow'
    return day
  }

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Discovery Calls</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {upcoming.length} upcoming · {past.length} past · All times AEST
        </p>
      </div>

      {/* Upcoming — grouped by day */}
      {upcoming.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No upcoming discovery calls</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Calls booked through the intake form will appear here
          </p>
        </div>
      )}

      {Object.entries(grouped).map(([day, calls]) => (
        <div key={day} className="space-y-3">
          {/* Day header */}
          <div className="flex items-center gap-3">
            <div className="text-center min-w-[52px]">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                {formatDate(calls[0].start_time, { month: 'short' })}
              </p>
              <p className="text-3xl font-bold leading-none">
                {formatDate(calls[0].start_time, { day: 'numeric' })}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(calls[0].start_time, { weekday: 'short' })}
              </p>
            </div>
            <div>
              <h2 className="font-semibold text-sm">
                {dayLabel(day)}
              </h2>
              <p className="text-xs text-muted-foreground">{calls.length} call{calls.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Calls for this day */}
          {calls.map(booking => (
            <div
              key={booking.id}
              className={`rounded-xl border p-5 space-y-4 ${
                day === today
                  ? 'border-blue-500/30 bg-blue-500/5'
                  : 'border-border bg-card'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <p className="font-semibold truncate">{booking.contact_name}</p>
                    {booking.brand_name && (
                      <Badge className="text-xs border bg-zinc-500/15 text-zinc-400 border-zinc-500/30">
                        {booking.brand_name}
                      </Badge>
                    )}
                    {day === today && (
                      <Badge className="text-xs border bg-blue-500/15 text-blue-400 border-blue-500/30">
                        Today
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {isoToTime(booking.start_time)} — {isoToTime(booking.end_time)} AEST
                  </div>
                </div>

                {booking.meet_link && (
                  <a
                    href={booking.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex-shrink-0"
                  >
                    <Video className="w-4 h-4" />
                    Join Meet
                  </a>
                )}
              </div>

              {/* Contact details */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-t border-border pt-3">
                <a href={`mailto:${booking.contact_email}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                  {booking.contact_email}
                </a>
                {booking.contact_phone && (
                  <a href={`tel:${booking.contact_phone}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                    {booking.contact_phone}
                  </a>
                )}
              </div>

              {/* Intake summary */}
              {booking.intake_summary && (
                <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2.5 leading-relaxed">
                  {booking.intake_summary}
                </div>
              )}

              {booking.meet_link && (
                <div className="text-xs text-muted-foreground/50 font-mono truncate">
                  {booking.meet_link}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Past calls */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Past calls</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Brand</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recording</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {past.slice(0, 20).map(booking => (
                  <tr key={booking.id} className="hover:bg-muted/30 transition-colors opacity-70">
                    <td className="px-4 py-3">
                      <p className="font-medium">{booking.contact_name}</p>
                      <p className="text-xs text-muted-foreground">{booking.contact_email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{booking.brand_name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {formatDate(booking.start_time, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {isoToTime(booking.start_time)}
                    </td>
                    <td className="px-4 py-3">
                      {booking.meet_link && (
                        <a href={booking.meet_link} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                          Meet link
                        </a>
                      )}
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
