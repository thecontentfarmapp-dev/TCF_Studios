import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import BrandApprovalActions from '@/components/brand/BrandApprovalActions'

export default async function BrandApprovalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('brand_id').eq('id', user.id).single()
  if (!profile?.brand_id) redirect('/login')

  const { data: scripts } = await supabase
    .from('scripts')
    .select('*, episodes(number, title, season_id, seasons(title, brand_id))')
    .eq('status', 'in_review')

  const brandScripts = scripts?.filter(s => {
    const ep = s.episodes as any
    return ep?.seasons?.brand_id === profile.brand_id
  }) || []

  const { data: approvedScripts } = await supabase
    .from('scripts')
    .select('*, episodes(number, title, seasons(title))')
    .not('brand_approved_at', 'is', null)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Approvals</h1>
        <p className="text-gray-500 mt-1">Review and approve scripts for your campaign</p>
      </div>

      {/* Pending */}
      {brandScripts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg inline-block">
            {brandScripts.length} pending your approval
          </h2>
          {brandScripts.map(script => {
            const ep = script.episodes as { number: number; title: string | null; season_id: string; seasons: { title: string } | null } | null
            return (
              <div key={script.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{ep?.seasons?.title} — Episode {ep?.number}: {ep?.title || 'Untitled'}</p>
                    <p className="text-sm text-gray-500 mt-0.5">Script v{script.version} · Submitted for review</p>
                  </div>
                  <Badge className="border text-xs bg-amber-50 text-amber-700 border-amber-200">Awaiting approval</Badge>
                </div>
                {script.content && (
                  <div className="px-6 py-4 bg-gray-50">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{script.content}</pre>
                  </div>
                )}
                {script.notes && (
                  <div className="px-6 py-3 bg-blue-50 border-t border-blue-100">
                    <p className="text-sm text-blue-800"><span className="font-medium">Notes from TCF:</span> {script.notes}</p>
                  </div>
                )}
                <div className="px-6 py-4 border-t border-gray-100">
                  <BrandApprovalActions scriptId={script.id} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {brandScripts.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-8 text-center">
          <p className="text-emerald-700 font-medium">All caught up — no scripts pending your approval</p>
        </div>
      )}

      {/* Previously approved */}
      {approvedScripts && approvedScripts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Previously approved</h2>
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {approvedScripts.slice(0, 10).map(script => {
                  const ep = script.episodes as { number: number; title: string | null; seasons: { title: string } | null } | null
                  return (
                    <tr key={script.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{ep?.seasons?.title} — Ep {ep?.number}</p>
                        <p className="text-xs text-gray-500">{ep?.title || 'Untitled'}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">v{script.version}</td>
                      <td className="px-4 py-3">
                        <Badge className="border text-xs bg-emerald-50 text-emerald-700 border-emerald-200">Approved</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {script.brand_approved_at ? new Date(script.brand_approved_at).toLocaleDateString() : ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
