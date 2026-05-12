'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Play, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { DeckContent } from '@/lib/deck'
import { DEFAULT_DECK } from '@/lib/deck'

export default function DeckEditPage() {
  const [deck, setDeck] = useState<DeckContent>(DEFAULT_DECK)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/deck')
      .then(r => r.json())
      .then(setDeck)
  }, [])

  function updateSlide(index: number, updates: Record<string, any>) {
    setDeck(d => ({
      slides: d.slides.map((s, i) => i === index ? { ...s, ...updates } : s),
    }))
  }

  function updatePoint(slideIndex: number, pointIndex: number, value: string) {
    setDeck(d => ({
      slides: d.slides.map((s, i) => {
        if (i !== slideIndex || !('points' in s)) return s
        const points = [...s.points]
        points[pointIndex] = value
        return { ...s, points }
      }),
    }))
  }

  function updateStat(slideIndex: number, statIndex: number, field: 'label' | 'value', val: string) {
    setDeck(d => ({
      slides: d.slides.map((s, i) => {
        if (i !== slideIndex || !('stats' in s)) return s
        const stats = [...s.stats]
        stats[statIndex] = { ...stats[statIndex], [field]: val }
        return { ...s, stats }
      }),
    }))
  }

  function updateStep(slideIndex: number, stepIndex: number, value: string, key: 'steps') {
    setDeck(d => ({
      slides: d.slides.map((s, i) => {
        if (i !== slideIndex || !(key in s)) return s
        const steps = [...(s as any)[key]]
        steps[stepIndex] = value
        return { ...s, [key]: steps }
      }),
    }))
  }

  async function save() {
    setSaving(true)
    await fetch('/api/admin/deck', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deck),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const labelClass = 'text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1.5 block'
  const inputClass = 'w-full bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none'

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Deck</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Changes are saved and reflected immediately in the presentation.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/deck"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Play className="w-3.5 h-3.5" /> Preview
          </Link>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      {deck.slides.map((slide, i) => (
        <div key={slide.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Slide {i + 1} — {slide.id === 'hero' ? 'Hero' : slide.id === 'truth' ? 'The Truth' : slide.id === 'who' ? 'Who We Are' : slide.id === 'work' ? 'The Work' : slide.id === 'process' ? 'Process' : 'Next Steps'}
          </p>

          {slide.id === 'hero' && (
            <div>
              <label className={labelClass}>Headline</label>
              <textarea className={inputClass} rows={2} value={slide.title}
                onChange={e => updateSlide(i, { title: e.target.value })} />
            </div>
          )}

          {slide.id === 'truth' && (
            <>
              <div>
                <label className={labelClass}>Line 1</label>
                <textarea className={inputClass} rows={3} value={slide.line1}
                  onChange={e => updateSlide(i, { line1: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Line 2</label>
                <textarea className={inputClass} rows={2} value={slide.line2}
                  onChange={e => updateSlide(i, { line2: e.target.value })} />
              </div>
            </>
          )}

          {slide.id === 'who' && (
            <div className="space-y-3">
              <label className={labelClass}>Points</label>
              {slide.points.map((p, pi) => (
                <textarea key={pi} className={inputClass} rows={2} value={p}
                  onChange={e => updatePoint(i, pi, e.target.value)} />
              ))}
            </div>
          )}

          {slide.id === 'work' && (
            <>
              <div>
                <label className={labelClass}>Headline</label>
                <input className={inputClass} value={slide.headline}
                  onChange={e => updateSlide(i, { headline: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {slide.stats.map((stat, si) => (
                  <div key={si} className="space-y-1.5">
                    <input className={inputClass} placeholder="Value" value={stat.value}
                      onChange={e => updateStat(i, si, 'value', e.target.value)} />
                    <input className={inputClass} placeholder="Label" value={stat.label}
                      onChange={e => updateStat(i, si, 'label', e.target.value)} />
                  </div>
                ))}
              </div>
              <div>
                <label className={labelClass}>Instagram handle</label>
                <input className={inputClass} value={slide.handle}
                  onChange={e => updateSlide(i, { handle: e.target.value })} />
              </div>
            </>
          )}

          {slide.id === 'process' && (
            <div className="space-y-3">
              <label className={labelClass}>Stages</label>
              {slide.steps.map((s, si) => (
                <input key={si} className={inputClass} value={s}
                  onChange={e => updateStep(i, si, e.target.value, 'steps')} />
              ))}
            </div>
          )}

          {slide.id === 'nextsteps' && (
            <>
              <div>
                <label className={labelClass}>Intro line</label>
                <textarea className={inputClass} rows={2} value={slide.intro}
                  onChange={e => updateSlide(i, { intro: e.target.value })} />
              </div>
              <div className="space-y-3">
                <label className={labelClass}>Steps</label>
                {slide.steps.map((s, si) => (
                  <textarea key={si} className={inputClass} rows={2} value={s}
                    onChange={e => updateStep(i, si, e.target.value, 'steps')} />
                ))}
              </div>
            </>
          )}
        </div>
      ))}

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
