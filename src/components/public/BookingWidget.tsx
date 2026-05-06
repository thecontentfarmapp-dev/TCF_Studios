'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Calendar, Loader2, ChevronRight, Video } from 'lucide-react'

type Slot = { start: string; end: string; label: string }
type Contact = { name: string; email: string; phone: string; brand: string }

type Props = {
  contact: Contact
  brandId?: string
  intakeSummary: string
}

type BookingStatus = 'idle' | 'loading_slots' | 'picking' | 'confirming' | 'booked' | 'error'

// Group slots by date label
function groupByDay(slots: Slot[]): Record<string, Slot[]> {
  const groups: Record<string, Slot[]> = {}
  for (const slot of slots) {
    const day = new Date(slot.start).toLocaleDateString('en-AU', {
      timeZone: 'Australia/Sydney',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
    if (!groups[day]) groups[day] = []
    groups[day].push(slot)
  }
  return groups
}

function timeOnly(isoStr: string) {
  return new Date(isoStr).toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export default function BookingWidget({ contact, brandId, intakeSummary }: Props) {
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>('idle')
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [meetLink, setMeetLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadSlots() {
    setBookingStatus('loading_slots')
    setError(null)
    try {
      const res = await fetch('/api/calendar/slots')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSlots(data.slots)
      setBookingStatus('picking')
    } catch (e: any) {
      setError('Unable to load available times. Please try again.')
      setBookingStatus('error')
    }
  }

  async function confirmBooking() {
    if (!selectedSlot) return
    setBookingStatus('confirming')
    try {
      const res = await fetch('/api/calendar/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: selectedSlot.start,
          end: selectedSlot.end,
          contact,
          brandId,
          intakeSummary,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMeetLink(data.meetLink)
      setBookingStatus('booked')
    } catch (e: any) {
      setError('Something went wrong booking your call. Please try again.')
      setBookingStatus('picking')
    }
  }

  const grouped = groupByDay(slots)
  const days = Object.keys(grouped)
  const slotsForSelectedDay = selectedDay ? (grouped[selectedDay] ?? []) : []

  // ── Idle state — "Book a call" CTA ──────────────────────────────────────────
  if (bookingStatus === 'idle') {
    return (
      <div className="mt-10 pt-8 border-t border-white/8 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-white/70">Want to lock in a time now?</p>
          <p className="text-xs text-white/35">30-minute discovery call · Google Meet</p>
        </div>
        <button
          onClick={loadSlots}
          className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white/8 border border-white/10 text-sm font-medium hover:bg-white/12 transition-colors"
        >
          <Calendar className="w-4 h-4 text-white/50" />
          Book a discovery call
          <ChevronRight className="w-4 h-4 text-white/30 ml-auto" />
        </button>
      </div>
    )
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (bookingStatus === 'loading_slots') {
    return (
      <div className="mt-10 pt-8 border-t border-white/8 flex items-center gap-3 text-sm text-white/40">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading available times...
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (bookingStatus === 'error') {
    return (
      <div className="mt-10 pt-8 border-t border-white/8 space-y-3">
        <p className="text-sm text-red-400">{error}</p>
        <button onClick={loadSlots} className="text-xs text-white/40 hover:text-white/70 transition-colors">
          Try again
        </button>
      </div>
    )
  }

  // ── Booked ───────────────────────────────────────────────────────────────────
  if (bookingStatus === 'booked') {
    return (
      <div className="mt-10 pt-8 border-t border-white/8 space-y-5">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-sm font-semibold text-emerald-300">You're booked in.</p>
        </div>

        {/* Call details */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wide mb-1">When</p>
            <p className="text-sm font-medium">{selectedSlot?.label} (AEST)</p>
          </div>
          {meetLink && (
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wide mb-1.5">Join the call</p>
              <a
                href={meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-white font-medium hover:opacity-80 transition-opacity"
              >
                <Video className="w-4 h-4 text-blue-400" />
                Open Google Meet
              </a>
            </div>
          )}
          <p className="text-xs text-white/30 pt-1 border-t border-white/8">
            A calendar invite has been sent to {contact.email}
          </p>
        </div>

        {/* What to expect */}
        <div className="space-y-2">
          <p className="text-xs text-white/40 uppercase tracking-wide font-medium">What we'll cover</p>
          <ul className="space-y-1.5">
            {[
              'Your brand goals and what you\'re looking to create',
              'Our production approach and process',
              'Timelines and next steps if it\'s a fit',
            ].map(item => (
              <li key={item} className="flex items-start gap-2 text-sm text-white/60">
                <span className="text-white/25 mt-0.5">—</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-white/30 pt-1">Feel free to bring any references or inspiration.</p>
        </div>
      </div>
    )
  }

  // ── Slot picker ──────────────────────────────────────────────────────────────
  return (
    <div className="mt-10 pt-8 border-t border-white/8 space-y-5">
      <div className="space-y-1">
        <p className="text-sm font-semibold">Book a discovery call</p>
        <p className="text-xs text-white/35">30 minutes · Google Meet · AEST</p>
      </div>

      {slots.length === 0 && (
        <p className="text-sm text-white/40">No available slots in the next 14 days. Our team will reach out to schedule manually.</p>
      )}

      {/* Day selector */}
      {days.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {days.slice(0, 12).map(day => {
            const date = new Date(grouped[day][0].start)
            const dayNum = date.toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney', day: 'numeric' })
            const dayName = date.toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney', weekday: 'short' })
            const monthName = date.toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney', month: 'short' })
            const isSelected = selectedDay === day
            return (
              <button
                key={day}
                onClick={() => { setSelectedDay(day); setSelectedSlot(null) }}
                className={`p-2.5 rounded-xl border text-center transition-colors ${
                  isSelected
                    ? 'border-white/40 bg-white/10 text-white'
                    : 'border-white/10 bg-white/3 text-white/50 hover:border-white/20 hover:text-white/80'
                }`}
              >
                <p className="text-xs font-medium">{dayName}</p>
                <p className="text-lg font-bold leading-tight">{dayNum}</p>
                <p className="text-xs text-white/40">{monthName}</p>
              </button>
            )
          })}
        </div>
      )}

      {/* Time slots for selected day */}
      {selectedDay && slotsForSelectedDay.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-white/40 uppercase tracking-wide font-medium">{selectedDay}</p>
          <div className="grid grid-cols-3 gap-2">
            {slotsForSelectedDay.map(slot => {
              const isSelected = selectedSlot?.start === slot.start
              return (
                <button
                  key={slot.start}
                  onClick={() => setSelectedSlot(slot)}
                  className={`px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                    isSelected
                      ? 'border-white/40 bg-white/10 text-white font-medium'
                      : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/80'
                  }`}
                >
                  {timeOnly(slot.start)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Confirm button */}
      {selectedSlot && (
        <div className="space-y-3 pt-1">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1">
            <p className="text-xs text-white/40">Booking for</p>
            <p className="text-sm font-medium">{contact.name} · {contact.email}</p>
            <p className="text-sm text-white/60">{selectedSlot.label}</p>
          </div>
          <button
            onClick={confirmBooking}
            disabled={bookingStatus === 'confirming'}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {bookingStatus === 'confirming' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</>
            ) : (
              <><Calendar className="w-4 h-4" /> Confirm booking</>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
