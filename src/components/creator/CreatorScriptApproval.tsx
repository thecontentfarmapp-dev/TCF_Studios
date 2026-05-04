'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, MessageSquare } from 'lucide-react'

export default function CreatorScriptApproval({ scriptId }: { scriptId: string }) {
  const [notes, setNotes] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [loading, setLoading] = useState<'approve' | 'feedback' | null>(null)
  const supabase = createClient()
  const router = useRouter()

  async function handleApprove() {
    setLoading('approve')
    await supabase
      .from('scripts')
      .update({ status: 'creator_approved', creator_approved_at: new Date().toISOString() })
      .eq('id', scriptId)
    setLoading(null)
    router.refresh()
  }

  async function handleFeedback() {
    if (!notes.trim()) return
    setLoading('feedback')
    await supabase
      .from('scripts')
      .update({ notes, status: 'draft' })
      .eq('id', scriptId)
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {!showFeedback ? (
        <div className="flex gap-3">
          <Button
            onClick={handleApprove}
            disabled={loading !== null}
            className="gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {loading === 'approve' ? 'Approving...' : 'Approve script'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFeedback(true)}
            className="gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Request changes
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Textarea
            placeholder="Describe the changes you'd like..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="text-sm"
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleFeedback}
              disabled={loading !== null || !notes.trim()}
              variant="outline"
            >
              {loading === 'feedback' ? 'Sending...' : 'Send feedback'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowFeedback(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
