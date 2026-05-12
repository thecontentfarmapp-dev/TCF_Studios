import { google } from 'googleapis'
import { getOAuthClient } from '@/lib/google/calendar'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: booking } = await adminSupabase
    .from('bookings')
    .select('start_time, brand_name, google_event_id')
    .eq('id', id)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  try {
    const auth = await getOAuthClient()
    const drive = google.drive({ version: 'v3', auth })

    const meetingTime = new Date(booking.start_time)

    // Search broadly — no time bounds, just find docs with TCF Studios in the name.
    // Fall back to brand name if nothing found.
    const searches = [
      `name contains 'TCF Studios' and mimeType = 'application/vnd.google-apps.document'`,
      `name contains '${booking.brand_name}' and mimeType = 'application/vnd.google-apps.document'`,
    ]

    let files: any[] = []
    for (const q of searches) {
      const { data } = await drive.files.list({
        q,
        fields: 'files(id, name, createdTime)',
        orderBy: 'createdTime desc',
        pageSize: 20,
      })
      if (data.files?.length) { files = data.files; break }
    }

    if (!files.length) {
      return NextResponse.json({
        error: 'No Gemini notes found in your Drive. Make sure Gemini note-taking was enabled during the call.',
      }, { status: 404 })
    }

    // Pick the doc with createdTime closest to the meeting start
    const file = files.reduce((best, f) => {
      const diff = Math.abs(new Date(f.createdTime).getTime() - meetingTime.getTime())
      const bestDiff = Math.abs(new Date(best.createdTime).getTime() - meetingTime.getTime())
      return diff < bestDiff ? f : best
    })

    // Export as plain text
    const { data: content } = await drive.files.export(
      { fileId: file.id!, mimeType: 'text/plain' },
      { responseType: 'text' }
    )

    const raw = typeof content === 'string' ? content : String(content)

    // Strip the Google Meet doc header (title, date, attendees, attachments, transcript link).
    // The header always ends after the "Transcript" line — actual notes follow.
    const headerMarkers = ['Transcript', 'Meeting records']
    let notes = raw
    for (const marker of headerMarkers) {
      const idx = raw.indexOf(marker)
      if (idx !== -1) {
        notes = raw.slice(idx + marker.length).trimStart()
        break
      }
    }

    // If nothing meaningful remains, return a clear message
    if (!notes.trim()) {
      return NextResponse.json({
        error: 'Gemini notes doc found but appears to have no notes content. Gemini may not have been active during the call.',
      }, { status: 404 })
    }

    // Save to bookings table
    await adminSupabase
      .from('bookings')
      .update({ gemini_notes: notes })
      .eq('id', id)

    return NextResponse.json({ success: true, notes })
  } catch (err: any) {
    console.error('Gemini notes error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
