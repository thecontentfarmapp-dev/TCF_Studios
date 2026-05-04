import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Building2, ExternalLink, Phone, Mail } from 'lucide-react'
import type { BrandStatus } from '@/lib/supabase/types'

const PIPELINE = [
  { key: 'lead', label: 'Lead', color: 'text-zinc-400' },
  { key: 'in_conversation', label: 'In Conversation', color: 'text-blue-400' },
  { key: 'proposal_sent', label: 'Proposal Sent', color: 'text-violet-400' },
  { key: 'negotiating', label: 'Negotiating', color: 'text-amber-400' },
  { key: 'signed', label: 'Signed', color: 'text-cyan-400' },
  { key: 'active', label: 'Active', color: 'text-emerald-400' },
  { key: 'alumni', label: 'Alumni', color: 'text-zinc-500' },
] as const

function badgeColor(status: BrandStatus) {
  const map: Record<BrandStatus, string> = {
    lead: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    in_conversation: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    proposal_sent: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    negotiating: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    signed: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    alumni: 'bg-zinc-600/15 text-zinc-500 border-zinc-600/30',
  }
  return map[status]
}

export default async function BrandsPage() {
  const supabase = await createClient()
  const { data: brands } = await supabase
    .from('brands')
    .select('*')
    .order('updated_at', { ascending: false })

  type BrandRow = NonNullable<typeof brands>[number]
  const byStatus = PIPELINE.reduce((acc, { key }) => {
    acc[key] = brands?.filter(b => b.status === key) || []
    return acc
  }, {} as Record<string, BrandRow[]>)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{brands?.length || 0} total</p>
        </div>
        <Link
          href="/admin/brands/new"
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + New brand
        </Link>
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE.map(({ key, label, color }) => {
          const col = byStatus[key] || []
          return (
            <div key={key} className="flex-shrink-0 w-72 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className={`text-sm font-semibold ${color}`}>{label}</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{col.length}</span>
              </div>
              <div className="space-y-2">
                {col.map(brand => (
                  <Link key={brand.id} href={`/admin/brands/${brand.id}`}>
                    <Card className="border-border hover:border-primary/30 transition-colors cursor-pointer mb-2">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{brand.company_name}</p>
                            {brand.industry && <p className="text-xs text-muted-foreground mt-0.5">{brand.industry}</p>}
                          </div>
                          <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{brand.contact_email}</span>
                          </div>
                          {brand.contact_phone && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              <span>{brand.contact_phone}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{brand.contact_name}</span>
                          {brand.website && (
                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                {col.length === 0 && (
                  <div className="p-4 rounded-lg border border-dashed border-border text-xs text-muted-foreground text-center">
                    No brands
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
