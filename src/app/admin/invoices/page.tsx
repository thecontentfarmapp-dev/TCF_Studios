import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Clock, Receipt } from 'lucide-react'

function statusColor(status: string) {
  const map: Record<string, string> = {
    draft: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    sent: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    overdue: 'bg-red-500/15 text-red-400 border-red-500/30',
  }
  return map[status] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
}

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, brands(company_name), seasons(title)')
    .order('created_at', { ascending: false })

  const total = invoices?.reduce((acc, i) => acc + Number(i.amount), 0) || 0
  const paid = invoices?.filter(i => i.status === 'paid').reduce((acc, i) => acc + Number(i.amount), 0) || 0
  const outstanding = invoices?.filter(i => ['sent', 'draft'].includes(i.status)).reduce((acc, i) => acc + Number(i.amount), 0) || 0
  const overdue = invoices?.filter(i => i.status === 'overdue') || []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{invoices?.length || 0} total</p>
        </div>
        <Link
          href="/admin/invoices/new"
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + New invoice
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card space-y-1">
          <p className="text-xs text-muted-foreground">Total invoiced</p>
          <p className="text-2xl font-bold">${total.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <p className="text-xs text-muted-foreground">Paid</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400">${paid.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <p className="text-xs text-muted-foreground">Outstanding</p>
          </div>
          <p className="text-2xl font-bold text-amber-400">${outstanding.toLocaleString()}</p>
        </div>
      </div>

      {/* Overdue alerts */}
      {overdue.map(inv => (
        <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>
            <span className="font-medium text-red-300">{inv.invoice_number}</span> — ${Number(inv.amount).toLocaleString()} from {(inv.brands as { company_name: string } | null)?.company_name} is overdue since {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : ''}
          </span>
        </div>
      ))}

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invoice</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Brand</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Season</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Due</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices?.map(inv => (
              <tr key={inv.id} className={`hover:bg-muted/30 transition-colors ${inv.status === 'overdue' ? 'bg-red-500/5' : ''}`}>
                <td className="px-4 py-3 font-mono font-medium text-sm">{inv.invoice_number}</td>
                <td className="px-4 py-3">{(inv.brands as { company_name: string } | null)?.company_name}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{(inv.seasons as { title: string } | null)?.title || '—'}</td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{inv.type}</td>
                <td className="px-4 py-3 font-semibold">${Number(inv.amount).toLocaleString()}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge className={`text-xs border ${statusColor(inv.status)}`}>{inv.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!invoices || invoices.length === 0) && (
          <div className="p-8 text-center text-sm text-muted-foreground">No invoices yet</div>
        )}
      </div>
    </div>
  )
}
