import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

function phaseColor(phase: string) {
  const map: Record<string, string> = {
    commissioning: 'bg-gray-100 text-gray-600 border-gray-200',
    development: 'bg-amber-50 text-amber-700 border-amber-200',
    pre_production: 'bg-blue-50 text-blue-700 border-blue-200',
    production: 'bg-violet-50 text-violet-700 border-violet-200',
    post: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    distribution: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    publishing: 'bg-green-50 text-green-700 border-green-200',
    evaluation: 'bg-pink-50 text-pink-700 border-pink-200',
  }
  return map[phase] || 'bg-gray-100 text-gray-600 border-gray-200'
}

export default async function BrandEpisodesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('brand_id').eq('id', user.id).single()
  if (!profile?.brand_id) redirect('/login')

  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, title, episodes(id, number, title, phase, due_date, published_at, scripts(status, version))')
    .eq('brand_id', profile.brand_id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Episodes</h1>
        <p className="text-gray-500 mt-1">Status of every episode in your campaign</p>
      </div>

      {seasons?.map(season => (
        <div key={season.id} className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">{season.title}</h2>
          <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-10">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phase</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Script</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(season.episodes as { id: string; number: number; title: string | null; phase: string; due_date: string | null; published_at: string | null; scripts: { status: string; version: number }[] }[])
                  ?.sort((a, b) => a.number - b.number)
                  .map(ep => {
                    const latestScript = ep.scripts?.sort((a, b) => b.version - a.version)[0]
                    return (
                      <tr key={ep.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{ep.number}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{ep.title || `Episode ${ep.number}`}</td>
                        <td className="px-4 py-3">
                          <Badge className={`border text-xs ${phaseColor(ep.phase)}`}>{ep.phase.replace('_', ' ')}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {latestScript ? (
                            <Badge className={`border text-xs ${latestScript.status === 'locked' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : latestScript.status === 'brand_approved' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                              v{latestScript.version} · {latestScript.status.replace('_', ' ')}
                            </Badge>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {ep.due_date ? new Date(ep.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—'}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {(!seasons || seasons.length === 0) && (
        <div className="text-center py-12 text-gray-400">No episodes yet</div>
      )}
    </div>
  )
}
