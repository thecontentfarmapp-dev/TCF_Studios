'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import Link from 'next/link'
import { ArrowLeft, Send, CheckCircle2, Mic, MicOff } from 'lucide-react'
import { useVoiceInput } from '@/hooks/useVoiceInput'

type SubmitResult = {
  success: boolean
  brandId?: string
  error?: string
}

export default function IntakeChat() {
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [submitted, setSubmitted] = useState<SubmitResult | null>(null)
  const [started, setStarted] = useState(false)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/intake/chat' }),
    onFinish(message) {
      const toolPart = (message as any).parts?.find(
        (p: any) => p.type === 'tool-submit_lead' && p.output != null
      )
      if (toolPart?.output) {
        setSubmitted(toolPart.output as SubmitResult)
      }
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  const { isListening, toggle: toggleMic, isSupported: micSupported } = useVoiceInput({
    onTranscript: (text) => setInputValue(text),
  })

  // Auto-start the conversation on mount
  useEffect(() => {
    if (!started) {
      setStarted(true)
      sendMessage({
        role: 'user',
        parts: [{ type: 'text', text: 'Hi, I\'m interested in working with TCF Studios.' }],
      })
    }
  }, [])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }, [inputValue])

  function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    if (!inputValue.trim() || isLoading) return
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

  function messageText(msg: any): string {
    if (!msg.parts) return typeof msg.content === 'string' ? msg.content : ''
    return msg.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
  }

  // Skip first auto-sent user message
  const visibleMessages = messages.slice(1)

  if (submitted?.success) {
    return (
      <div className="min-h-screen bg-[#080810] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold">You're in the queue.</h1>
            <p className="text-white/50 leading-relaxed">
              We've received your brief. TJ will review it and reach out within 24 hours to schedule a discovery call.
            </p>
          </div>
          <div className="pt-4">
            <Link
              href="/"
              className="text-sm text-white/30 hover:text-white/60 transition-colors"
            >
              ← Back to thecontentfarm
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-5 border-b border-white/6 flex items-center gap-4">
        <Link href="/" className="text-white/30 hover:text-white/60 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-white flex items-center justify-center flex-shrink-0">
            <span className="text-black text-[9px] font-black tracking-tight">TCF</span>
          </div>
          <span className="text-sm font-medium text-white/70">Work With Us</span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-xl mx-auto space-y-5">
          {visibleMessages.map((msg) => {
            const text = messageText(msg)
            if (!text) return null

            if (msg.role === 'user') {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm bg-white/10 text-sm leading-relaxed">
                    {text}
                  </div>
                </div>
              )
            }

            return (
              <div key={msg.id} className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-black text-[9px] font-black tracking-tight">TCF</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed text-white/85 whitespace-pre-wrap">{text}</p>
                </div>
              </div>
            )
          })}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded bg-white flex items-center justify-center flex-shrink-0">
                <span className="text-black text-[9px] font-black tracking-tight">TCF</span>
              </div>
              <div className="flex items-center gap-1 pt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      {!submitted && (
        <div className="flex-shrink-0 border-t border-white/6 px-4 py-4">
          <div className="max-w-xl mx-auto space-y-2">
            {isListening && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
                <p className="text-xs text-red-300">Listening...</p>
              </div>
            )}
            <form onSubmit={handleSend} className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isLoading ? '' : 'Reply...'}
                disabled={isLoading}
                rows={1}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 resize-none leading-relaxed disabled:opacity-40"
              />
              {micSupported && (
                <button
                  type="button"
                  onClick={() => toggleMic(inputValue)}
                  disabled={isLoading}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
                    isListening
                      ? 'bg-red-500 text-white'
                      : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/70'
                  } disabled:opacity-40`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center hover:bg-white/90 transition-colors flex-shrink-0 disabled:opacity-30"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-center text-xs text-white/20">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
