'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Video, X, Mail, Phone } from 'lucide-react'

type Booking = {
  id: string
  contact_name: string
  brand_name: string
  contact_email: string
  contact_phone: string | null
  start_time: string
  end_time: string
  meet_link: string | null
  intake_summary: string | null
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-AU', {
    timeZone: 'Australia/Sydney',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', {
    timeZone: 'Australia/Sydney',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function CalendarView() {
  const [today] = useState(() => new Date())
  const [current, setCurrent] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selected, setSelected] = useState<Booking | null>(null)

  const year = current.getFullYear()
  const month = current.getMonth()

  useEffect(() => {
    const supabase = createClient()
    const rangeStart = new Date(year, month, 1).toISOString()
    const rangeEnd = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
    supabase
      .from('bookings')
      .select('*')
      .gte('start_time', rangeStart)
      .lte('start_time', rangeEnd)
      .order('start_time')
      .then(({ data }) => setBookings(data ?? []))
  }, [year, month])

  // Build 42-cell grid (6 rows × 7 cols)
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()

  const cells: { date: Date; current: boolean }[] = []
  for (let i = firstDow - 1; i >= 0; i--)
    cells.push({ date: new Date(year, month - 1, daysInPrev - i), current: false })
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ date: new Date(year, month, d), current: true })
  while (cells.length < 42)
    cells.push({ date: new Date(year, month + 1, cells.length - firstDow - daysInMonth + 1), current: false })

  function bookingsFor(date: Date) {
    return bookings.filter(b => {
      const d = new Date(b.start_time)
      return d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
    })
  }

  function isToday(date: Date) {
    return date.toDateString() === today.toDateString()
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0 p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{MONTHS[month]} {year}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {bookings.length} discovery call{bookings.length !== 1 ? 's' : ''} this month
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrent(new Date(year, month - 1, 1))}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrent(new Date(today.getFullYear(), today.getMonth(), 1))}
              className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setCurrent(new Date(year, month + 1, 1))}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="flex-1 flex flex-col border border-border rounded-xl overflow-hidden min-h-0">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/30 flex-shrink-0">
            {DAYS.map(d => (
              <div key={d} className="py-2.5 text-xs font-medium text-muted-foreground text-center uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 flex-1" style={{ gridTemplateRows: 'repeat(6, 1fr)' }}>
            {cells.map((cell, i) => {
              const dayBookings = bookingsFor(cell.date)
              const todayCell = isToday(cell.date)
              const isLast = i >= 35
              return (
                <div
                  key={i}
                  className={`${i % 7 !== 6 ? 'border-r' : ''} ${!isLast ? 'border-b' : ''} border-border p-1.5 overflow-hidden ${
                    !cell.current ? 'bg-muted/10' : ''
                  }`}
                >
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1 ${
                    todayCell
                      ? 'bg-primary text-primary-foreground font-bold'
                      : cell.current
                        ? 'text-foreground'
                        : 'text-muted-foreground/30'
                  }`}>
                    {cell.date.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayBookings.map(b => (
                      <button
                        key={b.id}
                        onClick={() => setSelected(b)}
                        className={`w-full text-left px-1.5 py-0.5 rounded text-xs truncate transition-colors ${
                          selected?.id === b.id
                            ? 'bg-blue-500/30 border border-blue-400/40 text-blue-200'
                            : 'bg-blue-500/12 border border-blue-500/20 text-blue-300 hover:bg-blue-500/22'
                        }`}
                      >
                        {formatTime(b.start_time)} {b.brand_name}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-72 flex-shrink-0 border-l border-border flex flex-col bg-card">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold">Discovery Call</p>
            <button
              onClick={() => setSelected(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Brand</p>
              <p className="font-semibold">{selected.brand_name}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">When</p>
              <p className="text-sm font-medium">{formatFullDate(selected.start_time)}</p>
              <p className="text-sm text-muted-foreground">
                {formatTime(selected.start_time)} – {formatTime(selected.end_time)} AEST
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Contact</p>
              <p className="text-sm font-medium mb-1">{selected.contact_name}</p>
              <a
                href={`mailto:${selected.contact_email}`}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
              >
                <Mail className="w-3 h-3 flex-shrink-0" />
                {selected.contact_email}
              </a>
              {selected.contact_phone && (
                <a
                  href={`tel:${selected.contact_phone}`}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  {selected.contact_phone}
                </a>
              )}
            </div>

            {selected.meet_link && (
              <a
                href={selected.meet_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-medium hover:bg-blue-500/20 transition-colors"
              >
                <Video className="w-4 h-4 flex-shrink-0" />
                Join Google Meet
              </a>
            )}

            {selected.intake_summary && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Brief</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{selected.intake_summary}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
