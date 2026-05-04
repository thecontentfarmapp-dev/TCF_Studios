'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, X, Send, RotateCcw, CheckCircle2, Loader2, Mic, MicOff } from 'lucide-react'
import { useVoiceInput } from '@/hooks/useVoiceInput'

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

const EXAMPLE_PROMPTS = [
  '12 shots, doc-comedy. Open wide on Alice at desk, push in to cursor blinking. Product reveal at shot 8. End on her holding the finished ebook.',
  '8 shots, handheld energy. Talent runs between 3 locations — coffee shop, studio, park. Include voiceover from the script. Fast cuts under 5s each.',
  '50 shots for a fast-cut montage sequence. Each shot 1–2 seconds. Show the chaos of writing — crumpled paper, empty coffee cups, delete key, frustrated face.',
]

export default function AiDirectorPanel({ episodeId, episodeTitle, onClose, onShotsGenerated }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [generated, setGenerated] = useState<GenerateResult | null>(null)
  const [hasConversation, setHasConversation] = useState(false)

  const { isListening, toggle: toggleMic, error: micError, isSupported: micSupported } = useVoiceInput({
    onTranscript: (text) => setInputValue(text),
  })

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

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`
  }, [inputValue])

  function handleReset() {
    setMessages([])
    setGenerated(null)
    setHasConversation(false)
    setInputValue('')
  }

  function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    if (!inputValue.trim() || isLoading) return
    setHasConversation(true)
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

  function usePrompt(p: string) {
    setInputValue(p)
    textareaRef.current?.focus()
  }

  function formatRuntime(secs: number) {
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
  }

  function messageText(msg: any): string {
    if (!msg.parts) return typeof msg.content === 'string' ? msg.content : ''
    return msg.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
  }

  function getToolResult(msg: any): GenerateResult | null {
    if (!msg.parts) return null
    const part = msg.parts.find((p: any) => p.type === 'tool-generate_shot_list' && p.output != null)
    return part?.output ?? null
  }

  function isToolPending(msg: any): boolean {
    if (!msg.parts) return false
    return msg.parts.some((p: any) => p.type === 'tool-generate_shot_list' && p.output == null)
  }

  const visibleMessages = messages

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
          {hasConversation && (
            <button
              onClick={handleReset}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Start over"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Welcome / conversation */}
      <div className="flex-1 overflow-y-auto">
        {!hasConversation ? (
          /* Welcome state */
          <div className="px-4 py-5 space-y-5">
            <div className="flex gap-2.5">
              <div className="w-6 h-6 rounded bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-violet-400" />
              </div>
              <div className="space-y-2">
                <p className="text-sm leading-relaxed">
                  I've read the script and episode context. Give me your brief — shot count, sequences, locations, dialogue direction, talent notes, anything — and I'll build the full shot list immediately.
                </p>
                <p className="text-xs text-muted-foreground">
                  The more detail you give, the better the output. One message is enough.
                </p>
              </div>
            </div>

            {/* Example prompts */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium px-0.5">Examples</p>
              {EXAMPLE_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => usePrompt(p)}
                  className="w-full text-left text-xs text-muted-foreground hover:text-foreground px-3 py-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-colors leading-relaxed"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Conversation */
          <div className="px-4 py-4 space-y-4">
            {visibleMessages.map((msg) => {
              if (msg.role === 'user') {
                const text = messageText(msg)
                if (!text) return null
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[90%] px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm leading-relaxed whitespace-pre-wrap">
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
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
                      </div>
                    )}
                    {toolPending && !text && (
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
                        <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white" onClick={onClose}>
                          View shot list
                        </Button>
                      </div>
                    )}
                    {toolResult?.success === false && (
                      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                        <p className="text-sm text-red-400">Something went wrong: {toolResult.error}</p>
                      </div>
                    )}
                  </div>
                )
              }
              return null
            })}

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
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border flex-shrink-0 space-y-2">
        {/* Listening indicator */}
        {isListening && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
            <p className="text-xs text-red-300">Listening... speak your brief</p>
          </div>
        )}
        {micError && (
          <p className="text-xs text-destructive">{micError}</p>
        )}
        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening...'
                : !hasConversation
                  ? 'Describe what you need — or tap the mic and speak...'
                  : isLoading ? 'Working on it...' : 'Refine, adjust, or add more...'
            }
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 resize-none leading-relaxed"
          />
          {micSupported && (
            <button
              type="button"
              onClick={() => toggleMic(inputValue)}
              disabled={isLoading}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 mb-0.5 ${
                isListening
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
              } disabled:opacity-40`}
              title={isListening ? 'Stop recording' : 'Speak your brief'}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 mb-0.5"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <p className="text-xs text-muted-foreground/40 text-center">
          Enter to send · Shift+Enter for new line · GPT-4o
        </p>
      </div>
    </div>
  )
}
