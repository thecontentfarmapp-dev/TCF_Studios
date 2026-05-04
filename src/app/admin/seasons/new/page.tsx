'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import CreatorMultiSelect from '@/components/admin/CreatorMultiSelect'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Brand, Creator } from '@/lib/supabase/types'

export default function NewSeasonPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [brands, setBrands] = useState<Brand[]>([])
  const [creators, setCreators] = useState<Creator[]>([])
  const [selectedCreatorIds, setSelectedCreatorIds] = useState<string[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState('development')
  const [form, setForm] = useState({
    title: '', show_bible: '', format: '',
    episode_count: '1',
  })

  useEffect(() => {
    supabase.from('brands').select('id, company_name').order('company_name').then(({ data }) => setBrands((data || []) as Brand[]))
    supabase.from('creators').select('id, name, niche, slot').order('name').then(({ data }) => setCreators((data || []) as Creator[]))
  }, [])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const primaryCreatorId = selectedCreatorIds[0] ?? null

    const payload = {
      title: form.title,
      show_bible: form.show_bible || null,
      format: form.format || null,
      episode_count: parseInt(form.episode_count),
      status: selectedStatus as 'development',
      creator_id: primaryCreatorId,
      creator_ids: selectedCreatorIds,
      brand_id: selectedBrandId || null,
    }

    const { data: season, error } = await supabase.from('seasons').insert([payload]).select().single()
    if (!error && season) {
      if (season.episode_count > 0) {
        const episodes = Array.from({ length: season.episode_count }, (_, i) => ({
          season_id: season.id,
          number: i + 1,
          title: `Episode ${i + 1}`,
          phase: 'development' as const,
        }))
        await supabase.from('episodes').insert(episodes)
      }
      router.push(`/admin/seasons/${season.id}`)
    }
    setLoading(false)
  }

  const selectedBrand = brands.find(b => b.id === selectedBrandId)

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/seasons" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">New Season</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Season details */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Season details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Season title *</Label>
              <Input value={form.title} onChange={e => set('title', e.target.value)} required placeholder="The Ebook" />
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Input value={form.format} onChange={e => set('format', e.target.value)} placeholder="60-second vertical docucomedy" />
            </div>
            <div className="space-y-2">
              <Label>Episode count *</Label>
              <Input value={form.episode_count} onChange={e => set('episode_count', e.target.value)} required type="number" min="1" max="100" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Show bible</Label>
              <Textarea value={form.show_bible} onChange={e => set('show_bible', e.target.value)} placeholder="The premise, characters, tone, narrative arc..." rows={4} />
            </div>
          </div>
        </div>

        {/* Attach */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Attach</h2>
          <div className="space-y-4">
            {/* Creators — multi-select */}
            <div className="space-y-2">
              <Label>Creators</Label>
              <CreatorMultiSelect
                creators={creators}
                selectedIds={selectedCreatorIds}
                onChange={setSelectedCreatorIds}
              />
              {selectedCreatorIds.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  First selected ({creators.find(c => c.id === selectedCreatorIds[0])?.name}) will be the primary creator.
                </p>
              )}
            </div>

            {/* Brand — custom trigger to show name not ID */}
            <div className="space-y-2">
              <Label>Brand (optional)</Label>
              <div className="relative">
                <Select value={selectedBrandId} onValueChange={v => setSelectedBrandId(v ?? '')}>
                  <SelectTrigger>
                    <span className={selectedBrand ? 'text-foreground' : 'text-muted-foreground'}>
                      {selectedBrand ? selectedBrand.company_name : 'Select brand'}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.company_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={v => setSelectedStatus(v ?? 'development')}>
                <SelectTrigger>
                  <span className="text-foreground capitalize">{selectedStatus.replace('_', ' ')}</span>
                </SelectTrigger>
                <SelectContent>
                  {['development', 'pre_production', 'production', 'post', 'distribution', 'complete'].map(s => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create season'}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
