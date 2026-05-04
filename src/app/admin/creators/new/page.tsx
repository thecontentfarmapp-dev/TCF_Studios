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

export default function NewCreatorPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    instagram_handle: '', tiktok_handle: '', youtube_handle: '',
    niche: '', audience_size: '', slot: '',
    status: 'prospect', deal_memo_signed: false, notes: '',
  })

  function set(k: string, v: string | boolean | null) { setForm(f => ({ ...f, [k]: v ?? '' })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const payload = {
      ...form,
      audience_size: form.audience_size ? parseInt(form.audience_size) : null,
    }
    const { data, error } = await supabase.from('creators').insert([payload]).select().single()
    if (!error && data) {
      router.push(`/admin/creators/${data.id}`)
    }
    setLoading(false)
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/creators" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">New Creator</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Creator</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Full name *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Alice Bleathman" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input value={form.email} onChange={e => set('email', e.target.value)} required type="email" placeholder="alice@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 555 000 1234" />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Social</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input value={form.instagram_handle} onChange={e => set('instagram_handle', e.target.value)} placeholder="@handle" />
            </div>
            <div className="space-y-2">
              <Label>TikTok</Label>
              <Input value={form.tiktok_handle} onChange={e => set('tiktok_handle', e.target.value)} placeholder="@handle" />
            </div>
            <div className="space-y-2">
              <Label>YouTube</Label>
              <Input value={form.youtube_handle} onChange={e => set('youtube_handle', e.target.value)} placeholder="@handle" />
            </div>
            <div className="space-y-2">
              <Label>Audience size (approx)</Label>
              <Input value={form.audience_size} onChange={e => set('audience_size', e.target.value)} type="number" placeholder="250000" />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pipeline</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Niche</Label>
              <Input value={form.niche} onChange={e => set('niche', e.target.value)} placeholder="lifestyle, food, fitness..." />
            </div>
            <div className="space-y-2">
              <Label>Slot</Label>
              <Input value={form.slot} onChange={e => set('slot', e.target.value)} placeholder="S1" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['prospect', 'in_conversation', 'soft_commitment', 'signed', 'active', 'alumni'].map(s => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Scouting notes</Label>
              <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Why they're interesting, audience quality, content style..." rows={3} />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create creator'}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
