'use client'

import { useState } from 'react'
import { Loader2, RefreshCw, FileText } from 'lucide-react'

export default function GeminiNotesButton({ bookingId, hasNotes, onSync }: {
  bookingId: string
  hasNotes: boolean
  onSync: (notes: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sync() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/admin/bookings/${bookingId}/gemini-notes`, { method: 'POST' })
    const data = await res.json()
    if (data.error) {
      setError(data.error)
    } else {
      onSync(data.notes)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-1">
      <button
        onClick={sync}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        {loading
          ? <Loader2 className="w-3 h-3 animate-spin" />
          : hasNotes
            ? <RefreshCw className="w-3 h-3" />
            : <FileText className="w-3 h-3" />
        }
        {loading ? 'Syncing...' : hasNotes ? 'Re-sync notes' : 'Sync meeting notes'}
      </button>
      {error && <p className="text-xs text-amber-400">{error}</p>}
    </div>
  )
}
