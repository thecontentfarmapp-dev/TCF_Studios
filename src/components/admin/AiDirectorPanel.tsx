'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, X, Send, RotateCcw, CheckCircle2, Loader2 } from 'lucide-react'

type Props = {
  episodeId: string
  episodeTitle: string
  onClose: () => void
  onShotsGenerated: () => void
}

type GenerateResult = {
  success: boolean
  shotCount?: number
  totalRuntime?: number
  summary?: string
  error?: string
}

export default function AiDirectorPanel({ episodeId, episodeTitle, onClose, onShotsGenerated }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [generated, setGenerated] = useState<GenerateResult | null>(null)
  const [started, setStarted] = useState(false)

  const { messages, sendMessage, setMessages, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai-director',
      body: { episodeId },
    }),
    onFinish({ message }) {
      const toolPart = (message as any).parts?.find(
        (p: any) => p.type === 'tool-generate_shot_list' && p.output != null
      )
      if (toolPart?.output) {
        const result = toolPart.output as GenerateResult
        setGenerated(result)
        if (result.success) onShotsGenerated()
      }
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Kick off conversation on mount
  useEffect(() => {
    if (!started) {
      setStarted(true)
      sendMessage({
        role: 'user',
        parts: [{ type: 'text', text: `Build me a full shot list for ${episodeTitle}.` }],
      })
    }
  }, [])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  function handleReset() {
    setMessages([])
    setGenerated(null)
    setStarted(false)
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return
    sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: inputValue.trim() }],
    })
    setInputValue('')
  }

  function formatRuntime(secs: number) {
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
  }

  // Extract text from a message's parts
  function messageText(msg: any): string {
    if (!msg.parts) return typeof msg.content === 'string' ? msg.content : ''
    return msg.parts
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text)
      .join('')
  }

  // Check if a message triggered the shot list tool
  function getToolResult(msg: any): GenerateResult | null {
    if (!msg.parts) return null
    const part = msg.parts.find((p: any) =>
      p.type === 'tool-generate_shot_list' && p.output != null
    )
    return part?.output ?? null
  }

  function isToolPending(msg: any): boolean {
    if (!msg.parts) return false
    return msg.parts.some((p: any) =>
      p.type === 'tool-generate_shot_list' && p.output == null
    )
  }

  // Skip first user message (auto-sent trigger)
  const visibleMessages = messages.slice(1)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-violet-500/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">AI Director</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[160px]">{episodeTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {messages.length > 0 && (
            <button
              onClick={handleReset}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Start over"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {visibleMessages.map((msg) => {
          if (msg.role === 'user') {
            const text = messageText(msg)
            if (!text) return null
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[85%] px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm leading-relaxed">
                  {text}
                </div>
              </div>
            )
          }

          if (msg.role === 'assistant') {
            const text = messageText(msg)
            const toolResult = getToolResult(msg)
            const toolPending = isToolPending(msg)

            return (
              <div key={msg.id} className="space-y-3">
                {text && (
                  <div className="flex gap-2.5">
                    <div className="w-6 h-6 rounded bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3 text-violet-400" />
                    </div>
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{text}</p>
                  </div>
                )}
                {toolPending && (
                  <div className="flex gap-2.5">
                    <div className="w-6 h-6 rounded bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
                    </div>
                    <p className="text-sm text-muted-foreground">Building shot list...</p>
                  </div>
                )}
                {toolResult?.success && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <p className="text-sm font-semibold text-emerald-300">Shot list committed</p>
                    </div>
                    <div className="flex gap-4 text-xs text-emerald-400/80">
                      <span>{toolResult.shotCount} shots</span>
                      <span>~{formatRuntime(toolResult.totalRuntime ?? 0)} runtime</span>
                    </div>
                    {toolResult.summary && (
                      <p className="text-xs text-muted-foreground">{toolResult.summary}</p>
                    )}
                    <Button
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                      onClick={onClose}
                    >
                      View shot list
                    </Button>
                  </div>
                )}
              </div>
            )
          }

          return null
        })}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3 h-3 text-violet-400" />
            </div>
            <div className="flex items-center gap-1 pt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border flex-shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder={isLoading ? 'AI Director is thinking...' : 'Reply...'}
            disabled={isLoading}
            className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <p className="text-xs text-muted-foreground/40 mt-2 text-center">
          GPT-4o · reads your script automatically
        </p>
      </div>
    </div>
  )
}
