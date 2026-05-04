'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import SeasonAiDirectorPanel from './SeasonAiDirectorPanel'
import { useRouter } from 'next/navigation'

type Props = {
  seasonId: string
  seasonTitle: string
  episodeCount: number
  showBible: string | null
}

export default function SeasonAiDirectorButton({ seasonId, seasonTitle, episodeCount, showBible }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  function handleComplete() {
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-400 text-sm font-medium hover:bg-violet-500/15 hover:text-violet-300 transition-colors"
      >
        <Sparkles className="w-3.5 h-3.5" />
        AI Showrunner
      </button>

      {open && (
        <div className="fixed inset-y-0 right-0 z-50 w-96 bg-card border-l border-border shadow-2xl flex flex-col">
          <SeasonAiDirectorPanel
            seasonId={seasonId}
            seasonTitle={seasonTitle}
            episodeCount={episodeCount}
            showBible={showBible}
            onClose={() => setOpen(false)}
            onComplete={handleComplete}
          />
        </div>
      )}
    </>
  )
}
