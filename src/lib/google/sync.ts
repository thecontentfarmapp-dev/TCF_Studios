import { google } from 'googleapis'
import { getOAuthClient } from './calendar'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function syncBookingsWithGoogle(): Promise<{ deleted: number; updated: number }> {
  const { data: bookings } = await adminSupabase
    .from('bookings')
    .select('id, google_event_id, start_time, end_time')
    .not('google_event_id', 'is', null)

  if (!bookings?.length) return { deleted: 0, updated: 0 }

  const auth = await getOAuthClient()
  const calendar = google.calendar({ version: 'v3', auth })
  const calendarId = process.env.GOOGLE_CALENDAR_ID ?? 'primary'

  let deleted = 0
  let updated = 0

  await Promise.all(bookings.map(async (booking) => {
    try {
      const { data: event } = await calendar.events.get({
        calendarId,
        eventId: booking.google_event_id!,
      })

      // Cancelled in Google Calendar → remove from DB
      if (event.status === 'cancelled') {
        await adminSupabase.from('bookings').delete().eq('id', booking.id)
        deleted++
        return
      }

      // Rescheduled → update times in DB
      const newStart = event.start?.dateTime
      const newEnd = event.end?.dateTime
      if (newStart && newEnd) {
        const startChanged = new Date(newStart).toISOString() !== new Date(booking.start_time).toISOString()
        const endChanged = new Date(newEnd).toISOString() !== new Date(booking.end_time).toISOString()
        if (startChanged || endChanged) {
          await adminSupabase
            .from('bookings')
            .update({
              start_time: new Date(newStart).toISOString(),
              end_time: new Date(newEnd).toISOString(),
            })
            .eq('id', booking.id)
          updated++
        }
      }
    } catch (err: any) {
      // 404 = deleted from Google Calendar
      if (err.response?.status === 404 || err.code === 404) {
        await adminSupabase.from('bookings').delete().eq('id', booking.id)
        deleted++
      }
    }
  }))

  return { deleted, updated }
}
