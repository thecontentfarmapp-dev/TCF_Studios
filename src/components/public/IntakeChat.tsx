'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Send, CheckCircle2, Mic, MicOff } from 'lucide-react'
import { useVoiceInput } from '@/hooks/useVoiceInput'

type ContactInfo = {
  name: string
  email: string
  phone: string
  brand: string
}

type SubmitResult = {
  success: boolean
  brandId?: string
  error?: string
}

// ─── Step 1: Contact form ────────────────────────────────────────────────────

function ContactForm({ onSubmit }: { onSubmit: (info: ContactInfo) => void }) {
  const [form, setForm] = useState<ContactInfo>({ name: '', email: '', phone: '', brand: '' })
  const [errors, setErrors] = useState<Partial<ContactInfo>>({})

  function set(k: keyof ContactInfo, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  function validate() {
    const e: Partial<ContactInfo> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    if (!form.brand.trim()) e.brand = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) onSubmit(form)
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-900/15 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex-shrink-0 px-6 py-5 border-b border-white/6 flex items-center gap-4">
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

      {/* Form */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Let's start with the basics.</h1>
            <p className="text-white/40 text-sm">We'll follow up within 24 hours.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 font-medium uppercase tracking-wide">Full name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Jane Smith"
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors ${errors.name ? 'border-red-500/50' : 'border-white/10'}`}
              />
              {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 font-medium uppercase tracking-wide">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="jane@yourbrand.com"
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors ${errors.email ? 'border-red-500/50' : 'border-white/10'}`}
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 font-medium uppercase tracking-wide">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+1 555 000 1234"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>

            {/* Brand */}
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 font-medium uppercase tracking-wide">Brand / Company *</label>
              <input
                type="text"
                value={form.brand}
                onChange={e => set('brand', e.target.value)}
                placeholder="Acme Co."
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors ${errors.brand ? 'border-red-500/50' : 'border-white/10'}`}
              />
              {errors.brand && <p className="text-xs text-red-400">{errors.brand}</p>}
            </div>

            <button
              type="submit"
              className="group w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors mt-2"
            >
              Continue
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: AI conversation ─────────────────────────────────────────────────

function Conversation({ contact, onDone }: { contact: ContactInfo; onDone: (result: SubmitResult) => void }) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [started, setStarted] = useState(false)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/intake/chat',
      body: { contact },
    }),
    onFinish(message) {
      const toolPart = (message as any).parts?.find(
        (p: any) => p.type === 'tool-submit_lead' && p.output != null
      )
      if (toolPart?.output) {
        onDone(toolPart.output as SubmitResult)
      }
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  const { isListening, toggle: toggleMic, isSupported: micSupported } = useVoiceInput({
    onTranscript: (text) => setInputValue(text),
  })

  // Kick off the conversation with contact info pre-loaded
  useEffect(() => {
    if (!started) {
      setStarted(true)
      sendMessage({
        role: 'user',
        parts: [{
          type: 'text',
          text: `Hi, I'm ${contact.name} from ${contact.brand}. I'm interested in working with TCF Studios.`,
        }],
      })
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }, [inputValue])

  function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    if (!inputValue.trim() || isLoading) return
    sendMessage({ role: 'user', parts: [{ type: 'text', text: inputValue.trim() }] })
    setInputValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  function messageText(msg: any): string {
    if (!msg.parts) return typeof msg.content === 'string' ? msg.content : ''
    return msg.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
  }

  const visibleMessages = messages.slice(1)

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-5 border-b border-white/6 flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-white flex items-center justify-center flex-shrink-0">
            <span className="text-black text-[9px] font-black tracking-tight">TCF</span>
          </div>
          <span className="text-sm font-medium text-white/70">Work With Us</span>
        </div>
        <div className="ml-auto text-xs text-white/25">
          {contact.name} · {contact.brand}
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
                <p className="flex-1 text-sm leading-relaxed text-white/85 whitespace-pre-wrap pt-1">{text}</p>
              </div>
            )
          })}

          {isLoading && (
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded bg-white flex items-center justify-center flex-shrink-0">
                <span className="text-black text-[9px] font-black tracking-tight">TCF</span>
              </div>
              <div className="flex items-center gap-1 pt-2.5">
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
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${isListening ? 'bg-red-500 text-white' : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/70'} disabled:opacity-40`}
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
          <p className="text-center text-xs text-white/20">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Success screen ──────────────────────────────────────────────────

function SuccessScreen() {
  return (
    <div className="min-h-screen bg-[#080810] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">You're in the queue.</h1>
          <p className="text-white/50 leading-relaxed">
            We've received your brief. TJ will review it and reach out within 24 hours to lock in a discovery call.
          </p>
        </div>
        <Link href="/" className="inline-block text-sm text-white/30 hover:text-white/60 transition-colors pt-2">
          ← Back to home
        </Link>
      </div>
    </div>
  )
}

// ─── Main controller ─────────────────────────────────────────────────────────

export default function IntakeChat() {
  const [contact, setContact] = useState<ContactInfo | null>(null)
  const [result, setResult] = useState<SubmitResult | null>(null)

  if (result?.success) return <SuccessScreen />
  if (contact) return <Conversation contact={contact} onDone={setResult} />
  return <ContactForm onSubmit={setContact} />
}
