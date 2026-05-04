'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Sparkles, X, Send, RotateCcw, CheckCircle2, Loader2,
  Circle, Film, ListVideo,
} from 'lucide-react'

type Props = {
  seasonId: string
  seasonTitle: string
  episodeCount: number
  showBible: string | null
  onClose: () => void
  onComplete: () => void
}

type EpisodeState = {
  number: number
  title: string | null
  shotCount: number
  runtime: number
  status: 'pending' | 'arc_ready' | 'shots_done' | 'error'
}

export default function SeasonAiDirectorPanel({
  seasonId, seasonTitle, episodeCount, showBible, onClose, onComplete,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [hasStarted, setHasStarted] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const { messages, sendMessage, setMessages, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai-season-director',
      body: { seasonId },
    }),
    onFinish() {
      setIsComplete(true)
      onComplete()
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Parse episode states from tool results in messages
  const episodeStates = useMemo<Map<number, EpisodeState>>(() => {
    const map = new Map<number, EpisodeState>()

    // Initialise all episodes as pending
    for (let i = 1; i <= episodeCount; i++) {
      map.set(i, { number: i, title: null, shotCount: 0, runtime: 0, status: 'pending' })
    }

    for (const msg of messages) {
      const parts: any[] = (msg as any).parts ?? []
      for (const part of parts) {
        // Episode arc result
        if (part.type === 'tool-update_episode_arc' && part.output?.episodes) {
          for (const ep of part.output.episodes) {
            const existing = map.get(ep.number) ?? { number: ep.number, title: null, shotCount: 0, runtime: 0, status: 'pending' }
            map.set(ep.number, { ...existing, title: ep.title, status: 'arc_ready' })
          }
        }
        // Shot generation result
        if (part.type === 'tool-generate_episode_shots' && part.output?.success) {
          const { episode_number, shot_count, runtime } = part.output
          const existing = map.get(episode_number) ?? { number: episode_number, title: null, shotCount: 0, runtime: 0, status: 'pending' }
          map.set(episode_number, { ...existing, shotCount: shot_count, runtime, status: 'shots_done' })
        }
      }
    }

    return map
  }, [messages, episodeCount])

  const episodeList = Array.from(episodeStates.values()).sort((a, b) => a.number - b.number)
  const arcDone = episodeList.every(e => e.status !== 'pending')
  const shotsDone = episodeList.filter(e => e.status === 'shots_done').length
  const totalShots = episodeList.reduce((acc, e) => acc + e.shotCount, 0)
  const progressPct = Math.round((shotsDone / Math.max(episodeCount, 1)) * 100)

  // Find currently-processing episode
  const currentEpisode = isLoading
    ? episodeList.find(e => e.status === 'arc_ready') ?? null
    : null

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [episodeStates, isLoading])

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`
  }, [inputValue])

  function handleReset() {
    setMessages([])
    setHasStarted(false)
    setIsComplete(false)
    setInputValue('')
  }

  function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    if (!inputValue.trim() || isLoading) return
    setHasStarted(true)
    sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: inputValue.trim() }],
    })
    setInputValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function formatRuntime(secs: number) {
    if (secs === 0) return ''
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
  }

  function estimatedTime() {
    // ~8s per episode for shot generation + ~15s for arc
    const seconds = episodeCount * 8 + 15
    if (seconds < 60) return `~${seconds}s`
    return `~${Math.ceil(seconds / 60)} min`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-violet-500/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">AI Showrunner</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[180px]">
              {seasonTitle} · {episodeCount} eps
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {hasStarted && !isLoading && (
            <button onClick={handleReset} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Start over">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!hasStarted ? (
          /* Welcome */
          <div className="px-4 py-5 space-y-5">
            <div className="flex gap-2.5">
              <div className="w-6 h-6 rounded bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-violet-400" />
              </div>
              <div className="space-y-2">
                <p className="text-sm leading-relaxed">
                  I'll generate the full {episodeCount}-episode series — arc, titles, loglines, and complete shot lists for every episode.
                  Estimated time: <span className="font-medium text-foreground">{estimatedTime()}</span>.
                </p>
                {showBible && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground font-medium mb-1.5 uppercase tracking-wide">Show bible loaded</p>
                    <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">{showBible}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Add any direction below — shot count per episode, specific sequences, locations, tone, talent direction, brand integration style, must-have moments.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Progress view */
          <div className="px-4 py-4 space-y-5">
            {/* Phase 1 — arc */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {arcDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Loader2 className="w-4 h-4 text-violet-400 animate-spin flex-shrink-0" />
                )}
                <p className="text-sm font-medium">
                  {arcDone ? 'Episode arc complete' : 'Building episode arc...'}
                </p>
              </div>
            </div>

            {/* Phase 2 — shots */}
            {arcDone && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isComplete ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-violet-400 animate-spin flex-shrink-0" />
                    )}
                    <p className="text-sm font-medium">
                      {isComplete
                        ? `All shots generated (${totalShots} total)`
                        : `Generating shots — ${shotsDone}/${episodeCount} episodes`}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{progressPct}%</span>
                </div>

                <Progress value={progressPct} className="h-1.5" />

                {/* Episode list */}
                <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                  {episodeList.map(ep => (
                    <div key={ep.number} className="flex items-center gap-3 px-3 py-2.5 text-xs">
                      <span className="font-mono text-muted-foreground w-6 flex-shrink-0">
                        {String(ep.number).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`truncate ${ep.title ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {ep.title ?? 'Pending...'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {ep.status === 'shots_done' && (
                          <span className="text-muted-foreground">
                            {ep.shotCount} shots{ep.runtime > 0 ? ` · ${formatRuntime(ep.runtime)}` : ''}
                          </span>
                        )}
                        {ep.status === 'shots_done' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {ep.status === 'arc_ready' && currentEpisode?.number === ep.number && (
                          <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                        )}
                        {ep.status === 'arc_ready' && currentEpisode?.number !== ep.number && (
                          <Circle className="w-3.5 h-3.5 text-muted-foreground/30" />
                        )}
                        {ep.status === 'pending' && (
                          <Circle className="w-3.5 h-3.5 text-muted-foreground/20" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Complete card */}
            {isComplete && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <p className="text-sm font-semibold text-emerald-300">Full season complete</p>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-emerald-400/80">
                  <span>{episodeCount} episodes</span>
                  <span>{totalShots} shots total</span>
                  <span>~{Math.round(totalShots / episodeCount)} shots/episode avg</span>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                  onClick={onClose}
                >
                  View season
                </Button>
              </div>
            )}

            {/* AI text responses */}
            {messages.map(msg => {
              if (msg.role !== 'assistant') return null
              const parts: any[] = (msg as any).parts ?? []
              const text = parts.filter(p => p.type === 'text').map(p => p.text).join('')
              if (!text) return null
              return (
                <div key={msg.id} className="flex gap-2.5">
                  <div className="w-6 h-6 rounded bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{text}</p>
                </div>
              )
            })}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input — only shown before starting */}
      {!hasStarted && (
        <div className="px-4 py-3 border-t border-border flex-shrink-0 space-y-2">
          <form onSubmit={handleSend} className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`e.g. "40 shots per episode, fast-cut TikTok energy, Alice in 3 locations, brand reveal at episode midpoints, creator looks to camera every 5th shot..."`}
              rows={3}
              className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none leading-relaxed"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 mb-0.5"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <p className="text-xs text-muted-foreground/40 text-center">
            Enter to generate · Shift+Enter for new line · GPT-4o
          </p>
        </div>
      )}
    </div>
  )
}
