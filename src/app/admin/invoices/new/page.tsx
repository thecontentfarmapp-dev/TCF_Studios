'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Brand, Season } from '@/lib/supabase/types'

export default function NewInvoicePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [brands, setBrands] = useState<Brand[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState('')
  const [selectedSeasonId, setSelectedSeasonId] = useState('')
  const [form, setForm] = useState({
    amount: '', type: 'custom',
    status: 'draft', due_date: '', notes: '',
  })

  useEffect(() => {
    supabase.from('brands').select('id, company_name').order('company_name').then(({ data }) => setBrands((data || []) as Brand[]))
    supabase.from('seasons').select('id, title').order('title').then(({ data }) => setSeasons((data || []) as Season[]))
  }, [])

  function set(k: string, v: string | null) { setForm(f => ({ ...f, [k]: v ?? '' })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from('invoices').insert([{
      brand_id: selectedBrandId,
      season_id: selectedSeasonId || null,
      amount: parseFloat(form.amount),
      type: form.type,
      status: form.status,
      due_date: form.due_date || null,
      notes: form.notes || null,
    }]).select().single()
    if (!error) router.push('/admin/invoices')
    setLoading(false)
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/invoices" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">New Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Brand *</Label>
              <Select value={selectedBrandId} onValueChange={v => setSelectedBrandId(v ?? '')}>
                <SelectTrigger>
                  <span className={selectedBrandId ? 'text-foreground' : 'text-muted-foreground'}>
                    {brands.find(b => b.id === selectedBrandId)?.company_name ?? 'Select brand'}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Season (optional)</Label>
              <Select value={selectedSeasonId} onValueChange={v => setSelectedSeasonId(v ?? '')}>
                <SelectTrigger>
                  <span className={selectedSeasonId ? 'text-foreground' : 'text-muted-foreground'}>
                    {seasons.find(s => s.id === selectedSeasonId)?.title ?? 'Select season'}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {seasons.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (NZD) *</Label>
              <Input value={form.amount} onChange={e => set('amount', e.target.value)} required type="number" min="0" step="0.01" placeholder="7500.00" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit (50%)</SelectItem>
                  <SelectItem value="final">Final (50%)</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due date</Label>
              <Input value={form.due_date} onChange={e => set('due_date', e.target.value)} type="date" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Internal notes..." rows={2} />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading || !selectedBrandId || !form.amount}>{loading ? 'Creating...' : 'Create invoice'}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
