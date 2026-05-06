import { createBooking } from '@/lib/google/calendar'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { start, end, contact, brandId, intakeSummary } = await request.json()

    if (!start || !end || !contact?.email || !contact?.name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { eventId, meetLink } = await createBooking({
      start,
      end,
      contactName: contact.name,
      contactEmail: contact.email,
      brandName: contact.brand,
      intakeSummary,
    })

    // Save booking to DB
    await adminSupabase.from('bookings').insert({
      brand_id: brandId ?? null,
      contact_name: contact.name,
      contact_email: contact.email,
      contact_phone: contact.phone ?? null,
      brand_name: contact.brand,
      start_time: start,
      end_time: end,
      google_event_id: eventId,
      meet_link: meetLink,
      intake_summary: intakeSummary,
    })

    // Send confirmation email to lead via Resend
    if (process.env.RESEND_API_KEY && meetLink) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const slotLabel = new Date(start).toLocaleString('en-AU', {
        timeZone: 'Australia/Sydney',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      const firstName = contact.name.split(' ')[0]
      await resend.emails.send({
        from: 'TCF Studios <hello@thecontentfarm.co>',
        to: [contact.email],
        subject: `Your discovery call with TCF Studios is confirmed`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111;">
            <div style="background:#0d0d1a;padding:32px;border-radius:12px;margin-bottom:24px;text-align:center;">
              <div style="width:40px;height:40px;background:#fff;border-radius:8px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
                <span style="font-weight:900;font-size:11px;letter-spacing:-0.5px;">TCF</span>
              </div>
              <p style="color:#fff;font-size:20px;font-weight:700;margin:0;">You're booked in.</p>
            </div>

            <p style="font-size:16px;margin-bottom:4px;">Hi ${firstName},</p>
            <p style="color:#444;margin-top:0;">Your 30-minute discovery call with The Content Farm Studios is confirmed.</p>

            <div style="background:#f9f9f9;border-radius:10px;padding:20px;margin:24px 0;">
              <p style="margin:0 0 6px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">When</p>
              <p style="margin:0;font-size:16px;font-weight:600;">${slotLabel} (AEST)</p>
            </div>

            <div style="background:#f9f9f9;border-radius:10px;padding:20px;margin:24px 0;">
              <p style="margin:0 0 6px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Join the call</p>
              <a href="${meetLink}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px;">Open Google Meet →</a>
              <p style="margin:12px 0 0;font-size:12px;color:#888;">${meetLink}</p>
            </div>

            <div style="border-left:3px solid #e5e5e5;padding:0 0 0 16px;margin:24px 0;">
              <p style="margin:0 0 8px;font-weight:600;font-size:14px;">What we'll cover</p>
              <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">
                Your brand goals and what you're looking to create — our production approach and process — timelines and next steps if it's a fit.
              </p>
            </div>

            <p style="color:#888;font-size:13px;">A calendar invite has been sent to ${contact.email}. Feel free to bring any references or inspiration to the call.</p>
            <p style="color:#666;font-size:14px;margin-top:24px;">— The Content Farm Studios</p>
          </div>
        `,
      })
    }

    return NextResponse.json({ success: true, meetLink, eventId })
  } catch (error: any) {
    console.error('Booking error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
