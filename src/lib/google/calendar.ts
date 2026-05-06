import { google } from 'googleapis'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const TIMEZONE = 'Australia/Sydney'
const SLOT_MINUTES = 30
const BUFFER_MINUTES = 30  // blocks slot before and after each booking
const BUSINESS_HOURS = { start: 8, end: 16 } // 8am–4pm Sydney
const DAYS_AHEAD = 14
const WORKING_DAYS = [1, 2, 3, 4, 5] // Mon–Fri (0=Sun, 6=Sat)

// Blocked windows — checked in Sydney local time
// day: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
const BLOCKED_WINDOWS = [
  { day: 2, startHour: 9,  endHour: 13 }, // Tue 9am–1pm
  { day: 3, startHour: 10, endHour: 13 }, // Wed 10am–1pm
  { day: 4, startHour: 12, endHour: 16 }, // Thu 12pm–4pm
]

const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Returns the day of week in Sydney timezone (0=Sun … 6=Sat)
function sydneyDayOfWeek(date: Date): number {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    weekday: 'long',
  }).format(date)
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].indexOf(name)
}

// Returns the hour (0–23) in Sydney timezone for a given UTC instant
function sydneyHour(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date)
  return parseInt(parts.find(p => p.type === 'hour')?.value ?? '0') % 24
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function getOAuthClient() {
  const { data } = await adminSupabase
    .from('settings')
    .select('value')
    .eq('key', 'google_refresh_token')
    .single()

  const refreshToken = data?.value ?? process.env.GOOGLE_REFRESH_TOKEN
  if (!refreshToken) throw new Error('Google refresh token not configured. Visit /api/auth/google to authorise.')

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  return oauth2Client
}

// ─── Available slots ──────────────────────────────────────────────────────────

export async function getAvailableSlots(): Promise<{ start: string; end: string; label: string }[]> {
  const auth = await getOAuthClient()
  const calendar = google.calendar({ version: 'v3', auth })

  // Earliest bookable slot: now + 24h, rounded up to next 30-min boundary.
  // This enforces a minimum 24-hour notice and blocks same-day bookings.
  const slotMs = SLOT_MINUTES * 60 * 1000
  const earliest = Date.now() + 24 * 60 * 60 * 1000
  const rangeStart = new Date(Math.ceil(earliest / slotMs) * slotMs)

  const rangeEnd = new Date(rangeStart)
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + DAYS_AHEAD)

  // Fetch busy periods from Google Calendar
  const freeBusy = await calendar.freebusy.query({
    requestBody: {
      timeMin: rangeStart.toISOString(),
      timeMax: rangeEnd.toISOString(),
      timeZone: TIMEZONE,
      items: [{ id: process.env.GOOGLE_CALENDAR_ID ?? 'primary' }],
    },
  })

  const busy = freeBusy.data.calendars?.[process.env.GOOGLE_CALENDAR_ID ?? 'primary']?.busy ?? []
  const bufferMs = BUFFER_MINUTES * 60 * 1000
  const slots: { start: string; end: string; label: string }[] = []

  // Iterate every 30 minutes across the whole range.
  // All filtering is done in Sydney timezone — fixes the UTC setHours bug.
  let cursor = new Date(rangeStart)

  while (cursor < rangeEnd) {
    const slotEnd = new Date(cursor.getTime() + slotMs)
    const dow = sydneyDayOfWeek(cursor)
    const hour = sydneyHour(cursor)

    // 1. Must be a working day in Sydney
    if (WORKING_DAYS.includes(dow)) {
      // 2. Must be within business hours in Sydney
      if (hour >= BUSINESS_HOURS.start && hour < BUSINESS_HOURS.end) {
        // 3. Not in a blocked window
        const isBlocked = BLOCKED_WINDOWS.some(
          w => w.day === dow && hour >= w.startHour && hour < w.endHour
        )

        // 4. Not overlapping a calendar event (+ buffer either side)
        const isBusy = busy.some(b => {
          const bStart = new Date(new Date(b.start!).getTime() - bufferMs)
          const bEnd   = new Date(new Date(b.end!).getTime() + bufferMs)
          return cursor < bEnd && slotEnd > bStart
        })

        if (!isBlocked && !isBusy) {
          const label = cursor.toLocaleString('en-AU', {
            timeZone: TIMEZONE,
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })
          slots.push({ start: cursor.toISOString(), end: slotEnd.toISOString(), label })
        }
      }
    }

    cursor = new Date(cursor.getTime() + slotMs)
  }

  return slots
}

// ─── Create booking ───────────────────────────────────────────────────────────

export async function createBooking(opts: {
  start: string
  end: string
  contactName: string
  contactEmail: string
  brandName: string
  intakeSummary: string
}) {
  const auth = await getOAuthClient()
  const calendar = google.calendar({ version: 'v3', auth })

  const event = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID ?? 'primary',
    conferenceDataVersion: 1,
    sendUpdates: 'all',
    requestBody: {
      summary: `Discovery Call — ${opts.brandName} × TCF Studios`,
      description: [
        `Discovery call with ${opts.contactName} from ${opts.brandName}.`,
        '',
        opts.intakeSummary,
        '',
        '—',
        'Booked via TCF Studios · studio.thecontentfarm.co',
      ].join('\n'),
      start: { dateTime: opts.start, timeZone: TIMEZONE },
      end: { dateTime: opts.end, timeZone: TIMEZONE },
      attendees: [{ email: opts.contactEmail, displayName: opts.contactName }],
      conferenceData: {
        createRequest: {
          requestId: `tcf-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  })

  const meetLink = event.data.conferenceData?.entryPoints?.find(
    e => e.entryPointType === 'video'
  )?.uri ?? null

  return { eventId: event.data.id, meetLink }
}
