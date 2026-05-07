'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Loader2 } from 'lucide-react'

const STATUSES = [
  { key: 'lead',            label: 'Lead' },
  { key: 'in_conversation', label: 'In Conversation' },
  { key: 'proposal_sent',   label: 'Proposal Sent' },
  { key: 'negotiating',     label: 'Negotiating' },
  { key: 'signed',          label: 'Signed' },
  { key: 'active',          label: 'Active' },
  { key: 'alumni',          label: 'Alumni' },
]

type Props = {
  brandId: string
  currentStatus: string
  currentNotes: string | null
}

export default function PostCallPanel({ brandId, currentStatus, currentNotes }: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [notes, setNotes] = useState(currentNotes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    setSaved(false)
    const supabase = createClient()
    await supabase
      .from('brands')
      .update({ status, notes })
      .eq('id', brandId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h2 className="text-sm font-semibold">Post-call update</h2>

      {/* Status */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Pipeline status</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <button
              key={s.key}
              onClick={() => setStatus(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                status === s.key
                  ? 'border-white/30 bg-white/10 text-white'
                  : 'border-border text-muted-foreground hover:border-white/20 hover:text-foreground'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Notes</p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add call notes, next steps, any context..."
          rows={4}
          className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {saving ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
        ) : saved ? (
          <><CheckCircle2 className="w-4 h-4" /> Saved</>
        ) : (
          'Save update'
        )}
      </button>
    </div>
  )
}
