import { createClient } from '@/lib/supabase/server'
import { statusColor, formatDate, formatDateShort } from '@/lib/status'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Film,
  Building2,
  Users,
  Receipt,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'

const PHASE_ORDER = ['commissioning', 'development', 'pre_production', 'production', 'post', 'distribution', 'publishing', 'evaluation']
const SEASON_ORDER = ['development', 'pre_production', 'production', 'post', 'distribution', 'complete']

function phaseProgress(phase: string) {
  return Math.round(((PHASE_ORDER.indexOf(phase) + 1) / PHASE_ORDER.length) * 100)
}

function seasonProgress(status: string) {
  return Math.round(((SEASON_ORDER.indexOf(status) + 1) / SEASON_ORDER.length) * 100)
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { data: brands },
    { data: creators },
    { data: seasons },
    { data: episodes },
    { data: scripts },
    { data: invoices },
    { data: shoots },
  ] = await Promise.all([
    supabase.from('brands').select('id, company_name, status, contact_name').order('created_at', { ascending: false }),
    supabase.from('creators').select('id, name, status').order('created_at', { ascending: false }),
    supabase.from('seasons').select('id, title, status, episode_count, creator_id, brand_id, creators(name), brands(company_name)').order('created_at', { ascending: false }),
    supabase.from('episodes').select('id, season_id, number, title, phase, due_date, seasons(title)').order('due_date', { ascending: true }),
    supabase.from('scripts').select('id, status, episode_id, episodes(number, seasons(title))').order('updated_at', { ascending: false }),
    supabase.from('invoices').select('id, invoice_number, amount, status, due_date, brands(company_name)').order('created_at', { ascending: false }),
    supabase.from('shoot_days').select('id, date, location_name, status, season_id, seasons(title)').order('date', { ascending: true }),
  ])

  const today = new Date().toISOString().split('T')[0]
  const todayShoots = shoots?.filter(s => s.date === today && s.status === 'scheduled') || []
  const overdueInvoices = invoices?.filter(i => i.status === 'overdue') || []
  const pendingScripts = scripts?.filter(s => s.status === 'in_review') || []
  const activeSeasons = seasons?.filter(s => !['complete', 'development'].includes(s.status)) || []
  const upcomingShoots = shoots?.filter(s => s.date >= today && s.status === 'scheduled').slice(0, 5) || []

  const stats = [
    { label: 'Active Brands', value: brands?.filter(b => b.status === 'active').length || 0, icon: Building2, color: 'text-blue-400' },
    { label: 'Active Creators', value: creators?.filter(c => c.status === 'active').length || 0, icon: Users, color: 'text-violet-400' },
    { label: 'Active Seasons', value: activeSeasons.length, icon: Film, color: 'text-cyan-400' },
    { label: 'Pending Approvals', value: pendingScripts.length, icon: Clock, color: 'text-amber-400' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString('en-NZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Alerts */}
      {(todayShoots.length > 0 || overdueInvoices.length > 0 || pendingScripts.length > 0) && (
        <div className="space-y-2">
          {todayShoots.map(s => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
              <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span><span className="font-medium text-blue-300">Shoot today:</span> {(s.seasons as unknown as { title: string } | null)?.title} at {s.location_name}</span>
            </div>
          ))}
          {overdueInvoices.map(i => (
            <Link key={i.id} href={`/admin/invoices`} className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm hover:bg-red-500/15 transition-colors">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span><span className="font-medium text-red-300">Overdue invoice:</span> {i.invoice_number} — ${i.amount?.toLocaleString()} from {(i.brands as unknown as { company_name: string } | null)?.company_name}</span>
            </Link>
          ))}
          {pendingScripts.length > 0 && (
            <Link href="/admin/scripts" className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm hover:bg-amber-500/15 transition-colors">
              <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span><span className="font-medium text-amber-300">{pendingScripts.length} script{pendingScripts.length !== 1 ? 's' : ''}</span> waiting for approval</span>
            </Link>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <Icon className={`w-5 h-5 ${color} mt-0.5`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active seasons */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Active Seasons</h2>
            <Link href="/admin/seasons" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all</Link>
          </div>
          {activeSeasons.length === 0 && (
            <Card className="border-border"><CardContent className="p-6 text-center text-sm text-muted-foreground">No active seasons</CardContent></Card>
          )}
          {activeSeasons.slice(0, 6).map(season => (
            <Link key={season.id} href={`/admin/seasons/${season.id}`}>
              <Card className="border-border hover:border-primary/30 transition-colors cursor-pointer mb-3">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="font-medium text-sm truncate">{season.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(season.creators as unknown as { name: string } | null)?.name}
                        {(season.brands as unknown as { company_name: string } | null)?.company_name && ` · ${(season.brands as unknown as { company_name: string }).company_name}`}
                      </p>
                    </div>
                    <Badge className={`text-xs border flex-shrink-0 ${statusColor(season.status)}`}>
                      {season.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <Progress value={seasonProgress(season.status)} className="h-1" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Upcoming shoots */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Upcoming Shoots</h2>
              <Link href="/admin/shoots" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all</Link>
            </div>
            {upcomingShoots.length === 0 && (
              <Card className="border-border"><CardContent className="p-4 text-center text-sm text-muted-foreground">No shoots scheduled</CardContent></Card>
            )}
            {upcomingShoots.map(shoot => {
              const d = new Date(shoot.date)
              return (
                <div key={shoot.id} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                  <div className="text-center min-w-[40px]">
                    <p className="text-xs text-muted-foreground uppercase">{d.toLocaleDateString('en', { month: 'short' })}</p>
                    <p className="text-lg font-bold leading-none">{d.getDate()}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{(shoot.seasons as unknown as { title: string } | null)?.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{shoot.location_name || 'Location TBD'}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Recent invoices */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Recent Invoices</h2>
              <Link href="/admin/invoices" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all</Link>
            </div>
            {invoices?.slice(0, 4).map(inv => (
              <div key={inv.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-card border border-border">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{inv.invoice_number}</p>
                  <p className="text-xs text-muted-foreground truncate">{(inv.brands as unknown as { company_name: string } | null)?.company_name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium">${Number(inv.amount).toLocaleString()}</p>
                  <Badge className={`text-xs border mt-1 ${statusColor(inv.status)}`}>{inv.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
