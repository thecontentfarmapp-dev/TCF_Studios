'use client'

import { useState } from 'react'
import { Loader2, RefreshCw, FileText, ChevronDown, ChevronUp } from 'lucide-react'

export default function GeminiNotesSection({ bookingId, initialNotes }: {
  bookingId: string
  initialNotes: string | null
}) {
  const [notes, setNotes] = useState(initialNotes)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  async function sync() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/admin/bookings/${bookingId}/gemini-notes`, { method: 'POST' })
    const data = await res.json()
    if (data.error) {
      setError(data.error)
    } else {
      setNotes(data.notes)
      setExpanded(true)
    }
    setLoading(false)
  }

  if (!notes) {
    return (
      <div className="space-y-1">
        <button
          onClick={sync}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
          {loading ? 'Looking for Gemini notes...' : 'Sync meeting notes'}
        </button>
        {error && <p className="text-xs text-amber-400">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <FileText className="w-3 h-3" />
          Meeting notes
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        <button
          onClick={sync}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {expanded && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2.5 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
          {notes}
        </div>
      )}
    </div>
  )
}
