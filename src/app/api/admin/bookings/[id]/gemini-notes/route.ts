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

    // Search for Gemini notes doc created around the time of the meeting
    const meetingTime = new Date(booking.start_time)
    const searchFrom = new Date(meetingTime.getTime() - 30 * 60 * 1000).toISOString() // 30min before
    const searchTo = new Date(meetingTime.getTime() + 4 * 60 * 60 * 1000).toISOString() // 4hr after

    const query = [
      `name contains 'TCF Studios'`,
      `mimeType = 'application/vnd.google-apps.document'`,
      `createdTime > '${searchFrom}'`,
      `createdTime < '${searchTo}'`,
    ].join(' and ')

    const { data: files } = await drive.files.list({
      q: query,
      fields: 'files(id, name, createdTime)',
      orderBy: 'createdTime desc',
      pageSize: 5,
    })

    if (!files?.files?.length) {
      return NextResponse.json({ error: 'No Gemini notes found for this meeting yet. Try again in a few minutes.' }, { status: 404 })
    }

    // Use the most relevant file (closest to meeting time)
    const file = files.files[0]

    // Export as plain text
    const { data: content } = await drive.files.export(
      { fileId: file.id!, mimeType: 'text/plain' },
      { responseType: 'text' }
    )

    const notes = typeof content === 'string' ? content : String(content)

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
