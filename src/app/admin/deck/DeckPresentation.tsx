'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Edit2, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { DeckContent, DeckSlide } from '@/lib/deck'

// ── Slide components ─────────────────────────────────────────────────────────

function Wordmark() {
  return (
    <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center flex-shrink-0">
      <span className="text-black text-[10px] font-black tracking-tight leading-none">TCF</span>
    </div>
  )
}

function Glow() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(255,255,255,0.04),transparent)]" />
    </div>
  )
}

function HeroSlide({ slide }: { slide: Extract<DeckSlide, { id: 'hero' }> }) {
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-12">
      <Glow />
      <Wordmark />
      <h1 className="mt-10 text-6xl md:text-7xl xl:text-8xl font-black tracking-tight text-white leading-[0.9] max-w-4xl">
        {slide.title}
      </h1>
    </div>
  )
}

function TruthSlide({ slide }: { slide: Extract<DeckSlide, { id: 'truth' }> }) {
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-12 space-y-10">
      <Glow />
      <p className="text-3xl md:text-4xl xl:text-5xl font-bold text-white leading-tight max-w-3xl">
        {slide.line1}
      </p>
      <div className="w-12 h-px bg-white/20" />
      <p className="text-2xl md:text-3xl xl:text-4xl font-semibold text-white/70 leading-tight max-w-3xl italic">
        {slide.line2}
      </p>
    </div>
  )
}

function WhoSlide({ slide }: { slide: Extract<DeckSlide, { id: 'who' }> }) {
  return (
    <div className="relative flex flex-col justify-center h-full px-16 xl:px-32 space-y-12">
      <Glow />
      <div className="flex items-center gap-3">
        <Wordmark />
        <span className="text-white/40 text-sm font-medium uppercase tracking-widest">Studio</span>
      </div>
      <ul className="space-y-8">
        {slide.points.map((point, i) => (
          <li key={i} className="flex items-start gap-5">
            <span className="text-white/25 text-lg font-bold mt-0.5 w-6 flex-shrink-0">0{i + 1}</span>
            <p className="text-2xl md:text-3xl xl:text-4xl font-semibold text-white leading-tight">{point}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function WorkSlide({ slide }: { slide: Extract<DeckSlide, { id: 'work' }> }) {
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-12 space-y-12">
      <Glow />
      <h2 className="text-4xl md:text-5xl xl:text-6xl font-black text-white tracking-tight">{slide.headline}</h2>
      <div className="grid grid-cols-4 gap-6 w-full max-w-3xl">
        {slide.stats.map((stat, i) => (
          <div key={i} className="border border-white/10 rounded-2xl p-6 bg-white/3 space-y-2">
            <p className="text-3xl md:text-4xl xl:text-5xl font-black text-white">{stat.value}</p>
            <p className="text-xs text-white/40 uppercase tracking-widest font-medium">{stat.label}</p>
          </div>
        ))}
      </div>
      <p className="text-white/30 text-sm tracking-wide">{slide.handle} on Instagram</p>
    </div>
  )
}

function ProcessSlide({ slide }: { slide: Extract<DeckSlide, { id: 'process' }> }) {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-12 space-y-12">
      <Glow />
      <h2 className="text-2xl font-bold text-white/60 tracking-wide uppercase text-sm">How we work</h2>
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {slide.steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full border border-white/15 bg-white/5 flex items-center justify-center mx-auto">
                <span className="text-white/50 text-sm font-bold">0{i + 1}</span>
              </div>
              <p className="text-sm md:text-base font-semibold text-white whitespace-nowrap">{step}</p>
            </div>
            {i < slide.steps.length - 1 && (
              <ArrowRight className="w-4 h-4 text-white/20 flex-shrink-0 mb-6" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function NextStepsSlide({ slide }: { slide: Extract<DeckSlide, { id: 'nextsteps' }> }) {
  return (
    <div className="relative flex flex-col justify-center h-full px-16 xl:px-32 space-y-12">
      <Glow />
      <div className="flex items-center gap-3">
        <Wordmark />
      </div>
      <p className="text-3xl md:text-4xl font-bold text-white max-w-xl">{slide.intro}</p>
      <ul className="space-y-6">
        {slide.steps.map((step, i) => (
          <li key={i} className="flex items-start gap-5">
            <span className="text-white/25 text-lg font-bold mt-0.5 w-6 flex-shrink-0">{i + 1}.</span>
            <p className="text-xl md:text-2xl text-white/80 leading-snug">{step}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function renderSlide(slide: DeckSlide) {
  switch (slide.id) {
    case 'hero':      return <HeroSlide slide={slide} />
    case 'truth':     return <TruthSlide slide={slide} />
    case 'who':       return <WhoSlide slide={slide} />
    case 'work':      return <WorkSlide slide={slide} />
    case 'process':   return <ProcessSlide slide={slide} />
    case 'nextsteps': return <NextStepsSlide slide={slide} />
  }
}

// ── Main presentation ─────────────────────────────────────────────────────────

export default function DeckPresentation({ deck }: { deck: DeckContent }) {
  const [current, setCurrent] = useState(0)
  const slides = deck.slides
  const total = slides.length

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') setCurrent(c => Math.min(c + 1, total - 1))
      if (e.key === 'ArrowLeft')                   setCurrent(c => Math.max(c - 1, 0))
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [total])

  return (
    <div className="fixed inset-0 z-50 bg-[#080810] flex flex-col select-none">
      {/* Slide */}
      <div className="flex-1 relative overflow-hidden">
        {renderSlide(slides[current])}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-8 py-4 border-t border-white/5">
        {/* Dot nav */}
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${
                i === current ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Arrows + counter */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/25">{current + 1} / {total}</span>
          <button
            onClick={() => setCurrent(c => Math.max(c - 1, 0))}
            disabled={current === 0}
            className="p-1.5 rounded-lg text-white/40 hover:text-white disabled:opacity-20 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrent(c => Math.min(c + 1, total - 1))}
            disabled={current === total - 1}
            className="p-1.5 rounded-lg text-white/40 hover:text-white disabled:opacity-20 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/deck/edit"
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            <Edit2 className="w-3 h-3" /> Edit
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            <X className="w-3 h-3" /> Exit
          </Link>
        </div>
      </div>
    </div>
  )
}
