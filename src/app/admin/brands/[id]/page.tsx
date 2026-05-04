import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Mail, Phone, Globe, ArrowLeft } from 'lucide-react'

function statusColor(status: string) {
  const map: Record<string, string> = {
    lead: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    in_conversation: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    proposal_sent: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    negotiating: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    signed: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    alumni: 'bg-zinc-600/15 text-zinc-500 border-zinc-600/30',
    paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    sent: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    overdue: 'bg-red-500/15 text-red-400 border-red-500/30',
    draft: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  }
  return map[status] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
}

export default async function BrandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: brand }, { data: seasons }, { data: invoices }, { data: briefs }] = await Promise.all([
    supabase.from('brands').select('*').eq('id', id).single(),
    supabase.from('seasons').select('*, creators(name)').eq('brand_id', id).order('created_at', { ascending: false }),
    supabase.from('invoices').select('*').eq('brand_id', id).order('created_at', { ascending: false }),
    supabase.from('brand_briefs').select('*').eq('brand_id', id).order('created_at', { ascending: false }),
  ])

  if (!brand) notFound()

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/brands" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{brand.company_name}</h1>
            <Badge className={`text-xs border ${statusColor(brand.status)}`}>{brand.status.replace('_', ' ')}</Badge>
          </div>
          {brand.industry && <p className="text-sm text-muted-foreground mt-0.5">{brand.industry}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact */}
        <Card className="border-border md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-semibold">{brand.contact_name}</p>
            <div className="space-y-2">
              <a href={`mailto:${brand.contact_email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="w-3.5 h-3.5" />{brand.contact_email}
              </a>
              {brand.contact_phone && (
                <a href={`tel:${brand.contact_phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Phone className="w-3.5 h-3.5" />{brand.contact_phone}
                </a>
              )}
              {brand.website && (
                <a href={brand.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Globe className="w-3.5 h-3.5" />{brand.website}
                </a>
              )}
            </div>
            {brand.notes && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground font-medium mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{brand.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main content */}
        <div className="md:col-span-2 space-y-4">
          {/* Seasons */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Seasons ({seasons?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {seasons?.length === 0 && <p className="text-sm text-muted-foreground">No seasons yet</p>}
              <div className="space-y-2">
                {seasons?.map(season => (
                  <Link key={season.id} href={`/admin/seasons/${season.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                    <div>
                      <p className="text-sm font-medium">{season.title}</p>
                      <p className="text-xs text-muted-foreground">{(season.creators as { name: string } | null)?.name} · {season.episode_count} episodes</p>
                    </div>
                    <Badge className={`text-xs border ${statusColor(season.status)}`}>{season.status.replace('_', ' ')}</Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Invoices ({invoices?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices?.length === 0 && <p className="text-sm text-muted-foreground">No invoices yet</p>}
              <div className="space-y-2">
                {invoices?.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                    <div>
                      <p className="text-sm font-medium">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{inv.type} · {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'No due date'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${Number(inv.amount).toLocaleString()}</p>
                      <Badge className={`text-xs border mt-1 ${statusColor(inv.status)}`}>{inv.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
