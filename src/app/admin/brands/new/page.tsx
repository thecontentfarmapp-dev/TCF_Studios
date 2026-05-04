'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewBrandPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    company_name: '', industry: '', website: '',
    contact_name: '', contact_email: '', contact_phone: '',
    status: 'lead', source: 'other', notes: '',
  })

  function set(k: string, v: string | null) { setForm(f => ({ ...f, [k]: v ?? '' })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from('brands').insert([form]).select().single()
    if (!error && data) {
      router.push(`/admin/brands/${data.id}`)
    }
    setLoading(false)
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/brands" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">New Brand</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Company</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Company name *</Label>
              <Input value={form.company_name} onChange={e => set('company_name', e.target.value)} required placeholder="Acme Co." />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Input value={form.industry} onChange={e => set('industry', e.target.value)} placeholder="Consumer Products" />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://example.com" type="url" />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contact</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Contact name *</Label>
              <Input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} required placeholder="Jane Smith" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input value={form.contact_email} onChange={e => set('contact_email', e.target.value)} required type="email" placeholder="jane@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="+1 555 000 1234" />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pipeline</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['lead', 'in_conversation', 'proposal_sent', 'negotiating', 'signed', 'active', 'alumni'].map(s => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={form.source} onValueChange={v => set('source', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['website_form', 'referral', 'outbound', 'other'].map(s => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Internal notes</Label>
              <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Scouting notes, relationship context..." rows={3} />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create brand'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
