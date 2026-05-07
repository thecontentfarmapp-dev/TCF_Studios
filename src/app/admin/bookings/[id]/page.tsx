import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Video, Mail, Phone, Clock, Calendar } from 'lucide-react'
import PrepNotesPanel from './PrepNotesPanel'
import PostCallPanel from './PostCallPanel'

const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TIMEZONE = 'Australia/Sydney'

function fmt(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleString('en-AU', { timeZone: TIMEZONE, ...opts })
}

function parseStoryAngle(story: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of story.split('\n')) {
    const idx = line.indexOf(': ')
    if (idx > -1) result[line.slice(0, idx).trim()] = line.slice(idx + 2).trim()
  }
  return result
}

const BRIEF_FIELDS = [
  { key: 'Product',          label: 'What they sell' },
  { key: 'Platforms',        label: 'Platforms & format' },
  { key: 'Audience',         label: 'Target audience' },
  { key: 'Prior experience', label: 'Prior experience' },
  { key: 'Budget',           label: 'Budget' },
  { key: 'Timeline',         label: 'Timeline' },
]

export default async function BookingPrepPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: booking } = await adminSupabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single()

  if (!booking) notFound()

  // Fetch brand + brief if linked
  let brand: any = null
  let brief: any = null
  if (booking.brand_id) {
    const [{ data: b }, { data: br }] = await Promise.all([
      adminSupabase.from('brands').select('*').eq('id', booking.brand_id).single(),
      adminSupabase.from('brand_briefs').select('*').eq('brand_id', booking.brand_id).order('created_at', { ascending: false }).limit(1).single(),
    ])
    brand = b
    brief = br
  }

  const parsed = brief?.story_angle ? parseStoryAngle(brief.story_angle) : {}

  const intakeData = {
    brand: booking.brand_name ?? '',
    product: parsed['Product'] ?? '',
    platforms: parsed['Platforms'] ?? '',
    audience: parsed['Audience'] ?? '',
    experience: parsed['Prior experience'] ?? '',
    budget: parsed['Budget'] ?? '',
    timeline: parsed['Timeline'] ?? '',
    goal: brief?.campaign_goal ?? '',
    summary: booking.intake_summary ?? '',
  }

  const hasIntake = Object.values(intakeData).some(v => v !== '')
  const isUpcoming = new Date(booking.start_time) > new Date()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/admin/bookings" className="text-muted-foreground hover:text-foreground transition-colors mt-1">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{booking.contact_name}</h1>
            {booking.brand_name && (
              <p className="text-sm text-muted-foreground mt-0.5">{booking.brand_name}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {fmt(booking.start_time, { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {fmt(booking.start_time, { hour: 'numeric', minute: '2-digit', hour12: true })} – {fmt(booking.end_time, { hour: 'numeric', minute: '2-digit', hour12: true })} AEST
              </span>
            </div>
          </div>
        </div>

        {booking.meet_link && (
          <a
            href={booking.meet_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            <Video className="w-4 h-4" />
            Join Meet
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — intake brief */}
        <div className="lg:col-span-3 space-y-4">
          {/* Contact */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h2 className="text-sm font-semibold">Contact</h2>
            <a href={`mailto:${booking.contact_email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="w-3.5 h-3.5" />{booking.contact_email}
            </a>
            {booking.contact_phone && (
              <a href={`tel:${booking.contact_phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Phone className="w-3.5 h-3.5" />{booking.contact_phone}
              </a>
            )}
          </div>

          {/* Intake brief */}
          {hasIntake && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h2 className="text-sm font-semibold">Intake brief</h2>
              <div className="space-y-3">
                {BRIEF_FIELDS.map(({ key, label }) =>
                  parsed[key] ? (
                    <div key={key} className="grid grid-cols-[120px_1fr] gap-3 text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{parsed[key]}</span>
                    </div>
                  ) : null
                )}
                {intakeData.goal && (
                  <div className="grid grid-cols-[120px_1fr] gap-3 text-sm">
                    <span className="text-muted-foreground">Campaign goal</span>
                    <span className="font-medium">{intakeData.goal}</span>
                  </div>
                )}
              </div>
              {intakeData.summary && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">Summary</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{intakeData.summary}</p>
                </div>
              )}
            </div>
          )}

          {!hasIntake && (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">No intake data — this booking was created manually.</p>
            </div>
          )}
        </div>

        {/* Right — AI prep + post-call */}
        <div className="lg:col-span-2 space-y-4">
          {hasIntake && (
            <PrepNotesPanel bookingId={id} intakeData={intakeData} />
          )}

          {brand && (
            <PostCallPanel
              brandId={booking.brand_id!}
              currentStatus={brand.status}
              currentNotes={brand.notes}
            />
          )}
        </div>
      </div>
    </div>
  )
}
