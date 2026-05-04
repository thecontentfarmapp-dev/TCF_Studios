import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

function statusStyle(status: string) {
  const map: Record<string, string> = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    sent: 'bg-blue-50 text-blue-700 border-blue-200',
    overdue: 'bg-red-50 text-red-700 border-red-200',
    draft: 'bg-gray-100 text-gray-600 border-gray-200',
  }
  return map[status] || 'bg-gray-100 text-gray-600 border-gray-200'
}

export default async function BrandInvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('brand_id').eq('id', user.id).single()
  if (!profile?.brand_id) redirect('/login')

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, seasons(title)')
    .eq('brand_id', profile.brand_id)
    .order('created_at', { ascending: false })

  const total = invoices?.reduce((acc, i) => acc + Number(i.amount), 0) || 0
  const paid = invoices?.filter(i => i.status === 'paid').reduce((acc, i) => acc + Number(i.amount), 0) || 0
  const outstanding = invoices?.filter(i => ['sent', 'overdue'].includes(i.status)) || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Invoices</h1>
        <p className="text-gray-500 mt-1">Your billing history with TCF Studios</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${total.toLocaleString()}</p>
        </div>
        <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-xl">
          <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Paid</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">${paid.toLocaleString()}</p>
        </div>
        <div className={`p-5 rounded-xl border ${outstanding.length > 0 ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
          <p className={`text-xs font-medium uppercase tracking-wide ${outstanding.length > 0 ? 'text-amber-600' : 'text-gray-500'}`}>Outstanding</p>
          <p className={`text-2xl font-bold mt-1 ${outstanding.length > 0 ? 'text-amber-700' : 'text-gray-900'}`}>
            ${outstanding.reduce((acc, i) => acc + Number(i.amount), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Outstanding invoices */}
      {outstanding.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Needs Payment</h2>
          {outstanding.map(inv => (
            <div key={inv.id} className={`p-5 rounded-xl border ${inv.status === 'overdue' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white shadow-sm'}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{inv.invoice_number}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{(inv.seasons as { title: string } | null)?.title} · {inv.type}</p>
                  {inv.due_date && (
                    <p className="text-xs text-gray-500 mt-1">Due {new Date(inv.due_date).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">${Number(inv.amount).toLocaleString()}</p>
                  <Badge className={`border text-xs mt-1 ${statusStyle(inv.status)}`}>{inv.status}</Badge>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">To pay this invoice, please contact TCF Studios or use the payment link that was emailed to you.</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All invoices */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Invoice History</h2>
        <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">For</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices?.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-gray-900">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-gray-600">{(inv.seasons as { title: string } | null)?.title || '—'}</td>
                  <td className="px-4 py-3 capitalize text-gray-500">{inv.type}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">${Number(inv.amount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Badge className={`border text-xs ${statusStyle(inv.status)}`}>{inv.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!invoices || invoices.length === 0) && (
            <div className="p-8 text-center text-sm text-gray-400">No invoices yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
