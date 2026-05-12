'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Edit2, X, ImagePlus } from 'lucide-react'
import Link from 'next/link'
import type { DeckContent, DeckSlide } from '@/lib/deck'

const RAINBOW = 'conic-gradient(from 0deg, oklch(60% 0.22 25), oklch(68% 0.2 60), oklch(72% 0.18 120), oklch(65% 0.18 200), oklch(55% 0.2 260), oklch(58% 0.22 310), oklch(60% 0.22 25))'
const D = 'font-[family-name:var(--font-display)]'

// ── Shared ────────────────────────────────────────────────────────────────────

function Wordmark() {
  return (
    <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: RAINBOW }}>
      <span className={`${D} text-white text-xs leading-none`} style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>TCF</span>
    </div>
  )
}

function FilmFrame({ className, label = 'Add image' }: { className?: string; label?: string }) {
  return (
    <div
      className={`relative overflow-hidden flex items-end justify-start ${className}`}
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.01) 60%, rgba(0,0,0,0.15) 100%)' }}
    >
      <div className="absolute inset-0 border border-white/[0.07]" style={{ borderRadius: 'inherit' }} />
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 5px)',
      }} />
      <div className="relative z-10 flex items-center gap-1.5 m-3 opacity-30">
        <ImagePlus className="w-3 h-3 text-white" />
        <span className="text-white text-[9px] uppercase tracking-[0.3em] font-medium">{label}</span>
      </div>
    </div>
  )
}

function ProgressArc({ current, total }: { current: number; total: number }) {
  const size = 44
  const sw = 1.5
  const r = (size - sw * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - (current + 1) / total)
  const c = size / 2
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden>
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={sw} />
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={sw}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 200ms ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`${D} text-[9px] text-white/25 tabular-nums tracking-wide`}>{current + 1}/{total}</span>
      </div>
    </div>
  )
}

// ── Slides ────────────────────────────────────────────────────────────────────

function HeroSlide({ slide }: { slide: Extract<DeckSlide, { id: 'hero' }> }) {
  return (
    <div className="relative h-full">
      {/* Full-bleed image placeholder */}
      <FilmFrame className="absolute inset-0 rounded-none" label="Hero image / production still" />

      {/* Cinematic overlay — dark bottom, lighter top */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to top, rgba(8,8,16,0.96) 0%, rgba(8,8,16,0.45) 45%, rgba(8,8,16,0.65) 100%)',
      }} />

      {/* Color wheel atmosphere */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[55vw] h-[55vw] rounded-full" style={{ background: RAINBOW, opacity: 0.03, filter: 'blur(40px)' }} />
      </div>

      {/* Content — wordmark top, headline bottom */}
      <div className="absolute inset-0 flex flex-col justify-between px-12 py-10">
        <Wordmark />
        <h1
          className={`${D} text-white uppercase leading-[0.88] tracking-wide`}
          style={{ fontSize: 'clamp(5rem, 12vw, 11rem)' }}
        >
          {slide.title}
        </h1>
      </div>
    </div>
  )
}

function TruthSlide({ slide }: { slide: Extract<DeckSlide, { id: 'truth' }> }) {
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-20 space-y-10">
      <p className={`${D} text-white uppercase leading-[0.88] tracking-wide max-w-4xl`} style={{ fontSize: 'clamp(2.8rem, 6vw, 6.5rem)' }}>
        {slide.line1}
      </p>
      <div className="w-16 h-px bg-white/10" />
      <p className={`${D} text-white/40 uppercase leading-[0.9] tracking-wide max-w-3xl`} style={{ fontSize: 'clamp(1.6rem, 3vw, 3.5rem)' }}>
        {slide.line2}
      </p>
    </div>
  )
}

function WhoSlide({ slide }: { slide: Extract<DeckSlide, { id: 'who' }> }) {
  return (
    <div className="relative flex h-full">
      {/* Left: content */}
      <div className="flex flex-col justify-center px-14 xl:px-20 space-y-10 w-[58%]">
        <div className="flex items-center gap-3">
          <Wordmark />
          <span className="text-white/25 text-[10px] font-medium uppercase tracking-[0.3em]">Studio</span>
        </div>
        <ul className="space-y-6">
          {slide.points.map((point, i) => (
            <li key={i} className="flex items-start gap-5">
              <span className={`${D} text-white/20 text-lg leading-none mt-1 w-7 flex-shrink-0`}>0{i + 1}</span>
              <p className={`${D} text-white uppercase leading-[0.9] tracking-wide`} style={{ fontSize: 'clamp(1.5rem, 2.8vw, 3rem)' }}>
                {point}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* Right: image — full height */}
      <div className="w-[42%] h-full relative">
        <FilmFrame className="absolute inset-0 rounded-none" label="Portrait / BTS shot" />
        {/* Gradient fade left edge to blend with content */}
        <div className="absolute inset-y-0 left-0 w-16 z-10" style={{
          background: 'linear-gradient(to right, #080810, transparent)',
        }} />
      </div>
    </div>
  )
}

function WorkSlide({ slide }: { slide: Extract<DeckSlide, { id: 'work' }> }) {
  const [hero, ...rest] = slide.stats
  return (
    <div className="relative flex flex-col h-full px-14 xl:px-20 py-12 space-y-8">
      <p className="text-[10px] text-white/25 uppercase tracking-[0.3em] font-medium">{slide.headline}</p>

      {/* Show stills strip */}
      <div className="grid grid-cols-3 gap-3 flex-shrink-0" style={{ height: '36%' }}>
        <FilmFrame className="rounded-lg" label="Show still" />
        <FilmFrame className="rounded-lg" label="Show still" />
        <FilmFrame className="rounded-lg" label="Show still" />
      </div>

      {/* Stats — asymmetric */}
      <div className="flex items-end gap-12 flex-wrap flex-1">
        <div>
          <p className={`${D} text-white uppercase leading-none tracking-wide`} style={{ fontSize: 'clamp(4rem, 10vw, 9rem)' }}>
            {hero.value}
          </p>
          <p className="text-[10px] text-white/20 uppercase tracking-[0.25em] mt-2 font-medium">{hero.label}</p>
        </div>
        <div className="flex gap-10 pb-1">
          {rest.map((stat, i) => (
            <div key={i}>
              <p className={`${D} text-white/55 uppercase leading-none tracking-wide`} style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3.5rem)' }}>
                {stat.value}
              </p>
              <p className="text-[9px] text-white/18 uppercase tracking-[0.25em] mt-1.5 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-white/15 uppercase tracking-[0.25em] font-medium">{slide.handle} on Instagram</p>
    </div>
  )
}

function ProcessSlide({ slide }: { slide: Extract<DeckSlide, { id: 'process' }> }) {
  return (
    <div className="relative flex flex-col h-full px-14 xl:px-20 justify-center space-y-12">
      <p className="text-[10px] text-white/25 uppercase tracking-[0.3em] font-medium">How we work</p>
      <div>
        {slide.steps.map((step, i) => (
          <div key={i} className="flex items-baseline gap-8 py-6 border-b border-white/[0.06] first:border-t first:border-white/[0.06]">
            <span className={`${D} text-white/18 text-base w-7 flex-shrink-0 tabular-nums`}>0{i + 1}</span>
            <p className={`${D} text-white uppercase leading-[0.88] tracking-wide`} style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3.75rem)' }}>
              {step}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function NextStepsSlide({ slide }: { slide: Extract<DeckSlide, { id: 'nextsteps' }> }) {
  return (
    <div className="relative flex flex-col h-full px-14 xl:px-20 py-14 justify-between">
      <Wordmark />
      <div className="space-y-10">
        <p className={`${D} text-white uppercase leading-[0.88] tracking-wide max-w-xl`} style={{ fontSize: 'clamp(2.2rem, 4.5vw, 5rem)' }}>
          {slide.intro}
        </p>
        <ul className="space-y-5">
          {slide.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-6">
              <span className={`${D} text-white/20 text-lg mt-0.5 w-6 flex-shrink-0`}>{i + 1}.</span>
              <p className={`${D} text-white/55 uppercase leading-[0.9] tracking-wide`} style={{ fontSize: 'clamp(1.1rem, 2.2vw, 2.2rem)' }}>
                {step}
              </p>
            </li>
          ))}
        </ul>
      </div>
      <p className={`${D} text-white/10 uppercase tracking-[0.5em] text-xs`}>We turn brands into shows</p>
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

// ── Presentation ──────────────────────────────────────────────────────────────

export default function DeckPresentation({ deck }: { deck: DeckContent }) {
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(true)
  const pending = useRef<number | null>(null)
  const slides = deck.slides
  const total = slides.length

  function goTo(next: number) {
    if (next === current || next < 0 || next >= total) return
    setVisible(false)
    pending.current = next
  }

  useEffect(() => {
    if (visible || pending.current === null) return
    const t = setTimeout(() => {
      setCurrent(pending.current!)
      pending.current = null
      setVisible(true)
    }, 150)
    return () => clearTimeout(t)
  }, [visible])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') goTo(current + 1)
      if (e.key === 'ArrowLeft')                   goTo(current - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current])

  return (
    <div className="fixed inset-0 z-50 bg-[#080810] flex flex-col select-none">
      <div
        className="flex-1 relative overflow-hidden"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 150ms ease-out' }}
      >
        {renderSlide(slides[current])}
      </div>

      <div className="flex items-center justify-between px-8 py-4 border-t border-white/[0.04]">
        <ProgressArc current={current} total={total} />
        <div className="flex items-center gap-2">
          <button onClick={() => goTo(current - 1)} disabled={current === 0}
            className="p-1.5 rounded-lg text-white/25 hover:text-white/60 disabled:opacity-20 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => goTo(current + 1)} disabled={current === total - 1}
            className="p-1.5 rounded-lg text-white/25 hover:text-white/60 disabled:opacity-20 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/admin/deck/edit" className="flex items-center gap-1.5 text-[11px] text-white/18 hover:text-white/50 transition-colors">
            <Edit2 className="w-3 h-3" /> Edit
          </Link>
          <Link href="/admin" className="flex items-center gap-1.5 text-[11px] text-white/18 hover:text-white/50 transition-colors">
            <X className="w-3 h-3" /> Exit
          </Link>
        </div>
      </div>
    </div>
  )
}
