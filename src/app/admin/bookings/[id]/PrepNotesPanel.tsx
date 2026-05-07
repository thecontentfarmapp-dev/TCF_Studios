'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'

type PrepData = {
  talking_points: string[]
  package_recommendation: string
  questions: string[]
}

type Props = {
  bookingId: string
  intakeData: {
    brand: string
    product: string
    platforms: string
    audience: string
    experience: string
    budget: string
    timeline: string
    goal: string
    summary: string
  }
}

export default function PrepNotesPanel({ bookingId, intakeData }: Props) {
  const [prep, setPrep] = useState<PrepData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cacheKey = `prep-${bookingId}`

  useEffect(() => {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try { setPrep(JSON.parse(cached)); return } catch {}
    }
    // Auto-generate on first load
    generate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey])

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/prep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intakeData),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPrep(data)
      localStorage.setItem(cacheKey, JSON.stringify(data))
    } catch (e: any) {
      setError('Failed to generate prep notes.')
    } finally {
      setLoading(false)
    }
  }

  function regenerate() {
    localStorage.removeItem(cacheKey)
    setPrep(null)
    generate()
  }

  if (!prep) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-semibold">AI Call Prep</h2>
        </div>
        {error ? (
          <>
            <p className="text-xs text-red-400">{error}</p>
            <button
              onClick={generate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium hover:bg-violet-500/20 transition-colors"
            >
              <Sparkles className="w-4 h-4" /> Try again
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
            Generating your call prep...
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-semibold">AI Call Prep</h2>
        </div>
        <button
          onClick={regenerate}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Regenerate
        </button>
      </div>

      {/* Talking points */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Talking points</p>
        <ul className="space-y-2">
          {prep.talking_points.map((point, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <span className="text-violet-400 font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
              <span className="text-foreground/90">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Package recommendation */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Package recommendation</p>
        <p className="text-sm text-foreground/90 leading-relaxed bg-violet-500/8 rounded-lg px-3 py-2.5 border border-violet-500/15">
          {prep.package_recommendation}
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Questions to ask</p>
        <ul className="space-y-2">
          {prep.questions.map((q, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <span className="text-violet-400 mt-0.5 flex-shrink-0">—</span>
              <span className="text-foreground/90">{q}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
