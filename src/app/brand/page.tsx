import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { CheckCircle2, Clock, AlertCircle, Film } from 'lucide-react'

const SEASON_ORDER = ['development', 'pre_production', 'production', 'post', 'distribution', 'complete']

function seasonProgress(status: string) {
  return Math.round(((SEASON_ORDER.indexOf(status) + 1) / SEASON_ORDER.length) * 100)
}

function statusPill(status: string) {
  const map: Record<string, string> = {
    development: 'bg-amber-50 text-amber-700 border-amber-200',
    pre_production: 'bg-blue-50 text-blue-700 border-blue-200',
    production: 'bg-violet-50 text-violet-700 border-violet-200',
    post: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    distribution: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    complete: 'bg-gray-50 text-gray-600 border-gray-200',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    sent: 'bg-blue-50 text-blue-700 border-blue-200',
    overdue: 'bg-red-50 text-red-700 border-red-200',
    draft: 'bg-gray-50 text-gray-600 border-gray-200',
  }
  return map[status] || 'bg-gray-50 text-gray-600 border-gray-200'
}

export default async function BrandOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('brand_id').eq('id', user.id).single()
  if (!profile?.brand_id) redirect('/login')

  const [{ data: seasons }, { data: invoices }, { data: pendingScripts }] = await Promise.all([
    supabase.from('seasons').select('*, creators(name), episodes(id, phase)').eq('brand_id', profile.brand_id).order('created_at', { ascending: false }),
    supabase.from('invoices').select('*').eq('brand_id', profile.brand_id).order('created_at', { ascending: false }),
    supabase.from('scripts').select('id, episode_id, status, version, episodes(season_id, seasons(brand_id))')
      .eq('status', 'in_review'),
  ])

  const activeSeasons = seasons?.filter(s => s.status !== 'complete') || []
  const latestInvoice = invoices?.[0]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Campaign Overview</h1>
        <p className="text-gray-500 mt-1">Your content in production with TCF Studios</p>
      </div>

      {/* Active campaign hero */}
      {activeSeasons.map(season => {
        const totalEps = season.episodes?.length || 0
        const completedEps = season.episodes?.filter((e: { phase: string }) => ['distribution', 'publishing', 'evaluation'].includes(e.phase)).length || 0
        return (
          <div key={season.id} className="bg-gray-900 rounded-2xl p-6 text-white space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-gray-400 text-sm font-medium uppercase tracking-wide">Active Season</p>
                <h2 className="text-2xl font-bold mt-1">{season.title}</h2>
                <p className="text-gray-300 mt-1">with {(season.creators as { name: string } | null)?.name}</p>
              </div>
              <Badge className={`border text-xs ${season.status === 'production' ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' : 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                {season.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Production progress</span>
                <span>{completedEps}/{totalEps} episodes done</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all"
                  style={{ width: `${totalEps > 0 ? Math.round((completedEps / totalEps) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        )
      })}

      {activeSeasons.length === 0 && (
        <div className="bg-gray-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-200">
          <Film className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No active campaigns — check back soon</p>
        </div>
      )}

      {/* Quick cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending approvals */}
        <Link href="/brand/approvals" className="block p-5 bg-amber-50 border border-amber-100 rounded-xl hover:border-amber-200 transition-colors space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <p className="text-sm font-semibold text-amber-900">Pending Approvals</p>
          </div>
          <p className="text-3xl font-bold text-amber-700">{pendingScripts?.length || 0}</p>
          <p className="text-xs text-amber-600">scripts awaiting your review</p>
        </Link>

        {/* Invoice status */}
        <Link href="/brand/invoices" className="block p-5 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-gray-600" />
            <p className="text-sm font-semibold text-gray-900">Latest Invoice</p>
          </div>
          {latestInvoice ? (
            <>
              <p className="text-2xl font-bold text-gray-900">${Number(latestInvoice.amount).toLocaleString()}</p>
              <Badge className={`border text-xs ${statusPill(latestInvoice.status)}`}>{latestInvoice.status}</Badge>
            </>
          ) : (
            <p className="text-sm text-gray-500">No invoices yet</p>
          )}
        </Link>

        {/* Total episodes */}
        <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm space-y-2">
          <p className="text-sm font-semibold text-gray-900">Total Episodes</p>
          <p className="text-3xl font-bold text-gray-900">
            {seasons?.reduce((acc, s) => acc + (s.episodes?.length || 0), 0) || 0}
          </p>
          <p className="text-xs text-gray-500">across all seasons</p>
        </div>
      </div>
    </div>
  )
}
