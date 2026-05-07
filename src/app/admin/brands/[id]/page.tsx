import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, Globe, Video, Calendar, Clock, ChevronRight, FileText, Receipt } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { statusColor } from '@/lib/status'
import DeleteBrandButton from './DeleteBrandButton'
import GeminiNotesSection from './GeminiNotesSection'

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
  { key: 'Platforms',        label: 'Platforms' },
  { key: 'Audience',         label: 'Audience' },
  { key: 'Prior experience', label: 'Experience' },
  { key: 'Budget',           label: 'Budget' },
  { key: 'Timeline',         label: 'Timeline' },
]

export default async function BrandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [
    { data: brand },
    { data: seasons },
    { data: invoices },
    { data: brief },
    { data: calls },
  ] = await Promise.all([
    adminSupabase.from('brands').select('*').eq('id', id).single(),
    adminSupabase.from('seasons').select('*, creators(name)').eq('brand_id', id).order('created_at', { ascending: false }),
    adminSupabase.from('invoices').select('*').eq('brand_id', id).order('created_at', { ascending: false }),
    adminSupabase.from('brand_briefs').select('*').eq('brand_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    adminSupabase.from('bookings').select('*').eq('brand_id', id).order('start_time', { ascending: false }),
  ])

  if (!brand) notFound()

  const parsed = brief?.story_angle ? parseStoryAngle(brief.story_angle) : {}
  const hasIntake = brief && Object.keys(parsed).length > 0

  const totalInvoiced = invoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) ?? 0
  const upcomingCall = calls?.find(c => new Date(c.start_time) > new Date())

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/admin/brands" className="text-muted-foreground hover:text-foreground transition-colors mt-1.5">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{brand.company_name}</h1>
              <Badge className={`text-xs border ${statusColor(brand.status)}`}>
                {brand.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            {brand.industry && <p className="text-sm text-muted-foreground mt-0.5">{brand.industry}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {upcomingCall?.meet_link && (
            <a
              href={upcomingCall.meet_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-medium hover:bg-blue-500/20 transition-colors"
            >
              <Video className="w-4 h-4" />
              Join upcoming call
            </a>
          )}
          <DeleteBrandButton brandId={brand.id} brandName={brand.company_name} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — main content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Discovery Calls */}
          <section className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold">Discovery Calls</h2>
              <span className="text-xs text-muted-foreground">{calls?.length ?? 0} total</span>
            </div>
            {!calls?.length ? (
              <div className="px-5 py-6 text-sm text-muted-foreground">No discovery calls yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {calls.map(call => {
                  const isPast = new Date(call.start_time) < new Date()
                  return (
                    <div key={call.id} className="px-5 py-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="font-medium">
                              {fmt(call.start_time, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {fmt(call.start_time, { hour: 'numeric', minute: '2-digit', hour12: true })} AEST
                            </span>
                            {!isPast && (
                              <Badge className="text-xs border bg-blue-500/15 text-blue-400 border-blue-500/30">Upcoming</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {call.meet_link && (
                            <a href={call.meet_link} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                              <Video className="w-3.5 h-3.5" /> Meet
                            </a>
                          )}
                          <Link href={`/admin/bookings/${call.id}`}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                            Call prep <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>

                      {/* Gemini notes */}
                      {isPast && (
                        <GeminiNotesSection
                          bookingId={call.id}
                          initialNotes={call.gemini_notes ?? null}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Intake Brief */}
          {hasIntake && (
            <section className="rounded-xl border border-border bg-card">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold">Intake Brief</h2>
              </div>
              <div className="px-5 py-4 space-y-3">
                {BRIEF_FIELDS.map(({ key, label }) =>
                  parsed[key] ? (
                    <div key={key} className="grid grid-cols-[130px_1fr] gap-3 text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span>{parsed[key]}</span>
                    </div>
                  ) : null
                )}
                {brief?.campaign_goal && (
                  <div className="grid grid-cols-[130px_1fr] gap-3 text-sm">
                    <span className="text-muted-foreground">Campaign goal</span>
                    <span>{brief.campaign_goal}</span>
                  </div>
                )}
                {brand.notes && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">Summary</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{brand.notes}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Seasons */}
          <section className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold">Seasons</h2>
              <Link href={`/admin/seasons/new?brand_id=${id}`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                + New season
              </Link>
            </div>
            {!seasons?.length ? (
              <div className="px-5 py-6 text-sm text-muted-foreground">No seasons yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {seasons.map(season => (
                  <Link key={season.id} href={`/admin/seasons/${season.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{season.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(season.creators as any)?.name} · {season.episode_count} episodes
                      </p>
                    </div>
                    <Badge className={`text-xs border ${statusColor(season.status)}`}>
                      {season.status.replace(/_/g, ' ')}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Invoices */}
          <section className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold">Invoices</h2>
              <Link href={`/admin/invoices/new?brand_id=${id}`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                + New invoice
              </Link>
            </div>
            {!invoices?.length ? (
              <div className="px-5 py-6 text-sm text-muted-foreground">No invoices yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {invoices.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm font-medium">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {inv.type} · {inv.due_date ? fmt(inv.due_date, { day: 'numeric', month: 'short', year: 'numeric' }) : 'No due date'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${Number(inv.amount).toLocaleString()}</p>
                      <Badge className={`text-xs border mt-1 ${statusColor(inv.status)}`}>{inv.status}</Badge>
                    </div>
                  </div>
                ))}
                {invoices.length > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 bg-muted/20">
                    <p className="text-xs text-muted-foreground font-medium">Total invoiced</p>
                    <p className="text-sm font-bold">${totalInvoiced.toLocaleString()}</p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Right — contact + status */}
        <div className="space-y-4">
          {/* Contact */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold">Contact</h2>
            <div>
              <p className="font-semibold">{brand.contact_name}</p>
              <div className="mt-2 space-y-2">
                <a href={`mailto:${brand.contact_email}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="w-3.5 h-3.5" />{brand.contact_email}
                </a>
                {brand.contact_phone && (
                  <a href={`tel:${brand.contact_phone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Phone className="w-3.5 h-3.5" />{brand.contact_phone}
                  </a>
                )}
                {brand.website && (
                  <a href={brand.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Globe className="w-3.5 h-3.5" />{brand.website}
                  </a>
                )}
              </div>
            </div>
          </section>

          {/* Quick stats from brief */}
          {hasIntake && (
            <section className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h2 className="text-sm font-semibold">At a glance</h2>
              {parsed['Budget'] && (
                <div>
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="text-sm font-semibold text-emerald-400">{parsed['Budget']}</p>
                </div>
              )}
              {parsed['Timeline'] && (
                <div>
                  <p className="text-xs text-muted-foreground">Timeline</p>
                  <p className="text-sm font-medium">{parsed['Timeline']}</p>
                </div>
              )}
              {parsed['Platforms'] && (
                <div>
                  <p className="text-xs text-muted-foreground">Platforms</p>
                  <p className="text-sm font-medium">{parsed['Platforms']}</p>
                </div>
              )}
              {invoices?.length ? (
                <div>
                  <p className="text-xs text-muted-foreground">Total invoiced</p>
                  <p className="text-sm font-semibold">${totalInvoiced.toLocaleString()}</p>
                </div>
              ) : null}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
