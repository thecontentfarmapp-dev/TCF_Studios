import { google } from 'googleapis'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const TIMEZONE = 'Australia/Sydney'
const SLOT_DURATION = 30 // minutes
const BUFFER_MINUTES = 30 // no back-to-back — block one slot before and after each booking
const BUSINESS_HOURS = { start: 8, end: 16 } // 8am–4pm Sydney
const DAYS_AHEAD = 14
const WORKING_DAYS = [1, 2, 3, 4, 5] // Mon–Fri

// Blocked windows per weekday (Sydney time) — day: 0=Sun,1=Mon,...6=Sat
const BLOCKED_WINDOWS = [
  { day: 2, startHour: 9,  endHour: 13 }, // Tue 9am–1pm
  { day: 3, startHour: 10, endHour: 13 }, // Wed 10am–1pm
  { day: 4, startHour: 12, endHour: 16 }, // Thu 12pm–4pm
]

const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

export async function getAvailableSlots(): Promise<{ start: string; end: string; label: string }[]> {
  const auth = await getOAuthClient()
  const calendar = google.calendar({ version: 'v3', auth })

  const now = new Date()
  // Start from tomorrow to give at least 24 hours notice
  const rangeStart = new Date(now)
  rangeStart.setDate(rangeStart.getDate() + 1)
  rangeStart.setHours(0, 0, 0, 0)

  const rangeEnd = new Date(rangeStart)
  rangeEnd.setDate(rangeEnd.getDate() + DAYS_AHEAD)

  // Get busy periods
  const freeBusy = await calendar.freebusy.query({
    requestBody: {
      timeMin: rangeStart.toISOString(),
      timeMax: rangeEnd.toISOString(),
      timeZone: TIMEZONE,
      items: [{ id: process.env.GOOGLE_CALENDAR_ID ?? 'primary' }],
    },
  })

  const busy = freeBusy.data.calendars?.[process.env.GOOGLE_CALENDAR_ID ?? 'primary']?.busy ?? []

  // Generate all possible slots
  const slots: { start: string; end: string; label: string }[] = []
  const cursor = new Date(rangeStart)

  while (cursor < rangeEnd) {
    const dayOfWeek = cursor.getDay()
    if (WORKING_DAYS.includes(dayOfWeek)) {
      // Generate slots for this day in NZST
      const dayStart = new Date(cursor)
      dayStart.setHours(BUSINESS_HOURS.start, 0, 0, 0)
      const dayEnd = new Date(cursor)
      dayEnd.setHours(BUSINESS_HOURS.end, 0, 0, 0)

      let slotStart = new Date(dayStart)
      while (slotStart < dayEnd) {
        const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION * 60 * 1000)
        if (slotEnd <= dayEnd) {
          // Get hour in Sydney time for blocked window check
          const sydneyHour = parseInt(
            slotStart.toLocaleString('en-AU', { timeZone: TIMEZONE, hour: 'numeric', hour12: false })
          )
          const isBlocked = BLOCKED_WINDOWS.some(
            w => w.day === dayOfWeek && sydneyHour >= w.startHour && sydneyHour < w.endHour
          )

          // Check if this slot overlaps any busy period (+ buffer either side)
          const bufferMs = BUFFER_MINUTES * 60 * 1000
          const isBusy = busy.some(b => {
            const busyStart = new Date(new Date(b.start!).getTime() - bufferMs)
            const busyEnd = new Date(new Date(b.end!).getTime() + bufferMs)
            return slotStart < busyEnd && slotEnd > busyStart
          })

          if (!isBusy && !isBlocked) {
            const label = slotStart.toLocaleString('en-AU', {
              timeZone: TIMEZONE,
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })
            slots.push({
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
              label,
            })
          }
        }
        slotStart = new Date(slotStart.getTime() + SLOT_DURATION * 60 * 1000)
      }
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return slots
}

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
