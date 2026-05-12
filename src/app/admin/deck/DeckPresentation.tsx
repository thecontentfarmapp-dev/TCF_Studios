'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Edit2, X } from 'lucide-react'
import Link from 'next/link'
import type { DeckContent, DeckSlide } from '@/lib/deck'

const RAINBOW = 'conic-gradient(from 0deg, oklch(60% 0.22 25), oklch(68% 0.2 60), oklch(72% 0.18 120), oklch(65% 0.18 200), oklch(55% 0.2 260), oklch(58% 0.22 310), oklch(60% 0.22 25))'
const DISPLAY = 'font-[family-name:var(--font-display)]'

function Wordmark() {
  return (
    <div
      className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
      style={{ background: RAINBOW }}
    >
      <span className={`${DISPLAY} text-white text-[11px] font-black tracking-tight leading-none`} style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>TCF</span>
    </div>
  )
}

function ColorWheelBackdrop() {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
      <div
        className="w-[62vw] h-[62vw] rounded-full"
        style={{ background: RAINBOW, opacity: 0.045, filter: 'blur(2px)' }}
      />
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
        <span className={`${DISPLAY} text-[9px] text-white/25 font-bold tabular-nums tracking-wide`}>{current + 1}/{total}</span>
      </div>
    </div>
  )
}

// ── Slides ────────────────────────────────────────────────────────────────────

function HeroSlide({ slide }: { slide: Extract<DeckSlide, { id: 'hero' }> }) {
  return (
    <div className="relative flex flex-col h-full px-12 pt-10 pb-12">
      <ColorWheelBackdrop />
      <Wordmark />
      <div className="flex-1 flex items-center">
        <h1
          className={`${DISPLAY} font-black text-white uppercase leading-[0.84] tracking-[-0.02em]`}
          style={{ fontSize: 'clamp(4rem, 11vw, 10.5rem)' }}
        >
          {slide.title}
        </h1>
      </div>
    </div>
  )
}

function TruthSlide({ slide }: { slide: Extract<DeckSlide, { id: 'truth' }> }) {
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-16 space-y-10">
      <p
        className={`${DISPLAY} font-black text-white leading-[0.88] tracking-[-0.02em] max-w-4xl`}
        style={{ fontSize: 'clamp(2.5rem, 5.5vw, 6rem)' }}
      >
        {slide.line1}
      </p>
      <div className="w-16 h-px bg-white/10" />
      <p
        className={`${DISPLAY} font-bold text-white/40 leading-[0.9] tracking-[-0.01em] max-w-3xl`}
        style={{ fontSize: 'clamp(1.6rem, 3.2vw, 3.5rem)' }}
      >
        {slide.line2}
      </p>
    </div>
  )
}

function WhoSlide({ slide }: { slide: Extract<DeckSlide, { id: 'who' }> }) {
  return (
    <div className="relative flex flex-col justify-center h-full px-16 xl:px-32 space-y-12">
      <div className="flex items-center gap-3">
        <Wordmark />
        <span className="text-white/25 text-[10px] font-medium uppercase tracking-[0.3em]">Studio</span>
      </div>
      <ul className="space-y-7">
        {slide.points.map((point, i) => (
          <li key={i} className="flex items-start gap-6">
            <span className={`${DISPLAY} text-white/18 text-base font-bold mt-0.5 w-7 flex-shrink-0 tabular-nums`}>0{i + 1}</span>
            <p
              className={`${DISPLAY} font-black text-white leading-[0.88] tracking-[-0.02em]`}
              style={{ fontSize: 'clamp(1.6rem, 3vw, 3.25rem)' }}
            >
              {point}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function WorkSlide({ slide }: { slide: Extract<DeckSlide, { id: 'work' }> }) {
  const [hero, ...rest] = slide.stats
  return (
    <div className="relative flex flex-col h-full px-16 xl:px-32 justify-center space-y-12">
      <p className="text-[10px] text-white/25 uppercase tracking-[0.3em] font-medium">{slide.headline}</p>
      <div className="flex items-end gap-16 flex-wrap">
        <div>
          <p
            className={`${DISPLAY} font-black text-white leading-none tracking-[-0.03em]`}
            style={{ fontSize: 'clamp(5.5rem, 14vw, 12rem)' }}
          >
            {hero.value}
          </p>
          <p className="text-[10px] text-white/20 uppercase tracking-[0.25em] mt-3 font-medium">{hero.label}</p>
        </div>
        <div className="space-y-6 pb-2">
          {rest.map((stat, i) => (
            <div key={i}>
              <p
                className={`${DISPLAY} font-black text-white/55 leading-none tracking-[-0.02em]`}
                style={{ fontSize: 'clamp(2.2rem, 4.5vw, 4.5rem)' }}
              >
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
    <div className="relative flex flex-col h-full px-16 xl:px-32 justify-center space-y-12">
      <p className="text-[10px] text-white/25 uppercase tracking-[0.3em] font-medium">How we work</p>
      <div>
        {slide.steps.map((step, i) => (
          <div key={i} className="flex items-baseline gap-8 py-6 border-b border-white/[0.06] first:border-t first:border-white/[0.06]">
            <span className={`${DISPLAY} text-white/18 text-sm font-bold tabular-nums w-6 flex-shrink-0`}>0{i + 1}</span>
            <p
              className={`${DISPLAY} font-black text-white leading-[0.88] tracking-[-0.02em]`}
              style={{ fontSize: 'clamp(1.6rem, 3.2vw, 3.25rem)' }}
            >
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
    <div className="relative flex flex-col h-full px-16 xl:px-32 py-14 justify-between">
      <Wordmark />
      <div className="space-y-10">
        <p
          className={`${DISPLAY} font-black text-white leading-[0.88] tracking-[-0.02em] max-w-xl`}
          style={{ fontSize: 'clamp(2rem, 4.5vw, 4.5rem)' }}
        >
          {slide.intro}
        </p>
        <ul className="space-y-5">
          {slide.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-6">
              <span className={`${DISPLAY} text-white/20 text-base font-bold mt-0.5 w-6 flex-shrink-0`}>{i + 1}.</span>
              <p
                className={`${DISPLAY} font-bold text-white/60 leading-[0.92] tracking-[-0.01em]`}
                style={{ fontSize: 'clamp(1.1rem, 2vw, 1.9rem)' }}
              >
                {step}
              </p>
            </li>
          ))}
        </ul>
      </div>
      <p className={`${DISPLAY} text-white/10 text-xs uppercase tracking-[0.4em] font-bold`}>We turn brands into shows</p>
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
