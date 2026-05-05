'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col">
      {/* Subtle grain overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

      {/* Radial glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-violet-900/20 blur-[120px]" />
      </div>

      {/* Nav */}
      <header className="relative z-10 px-8 py-7 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-white flex items-center justify-center">
            <span className="text-black text-[10px] font-black tracking-tight">TCF</span>
          </div>
          <span className="text-sm font-semibold tracking-tight">The Content Farm</span>
        </div>
        <Link
          href="/login"
          className="text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          Studio login
        </Link>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="space-y-8 max-w-2xl mx-auto">
          {/* Label */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/50 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Now taking brand partnerships
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05]">
              Content that
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400">
                actually converts.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/50 font-light max-w-lg mx-auto leading-relaxed">
              We produce short-form vertical video for brands — scripted, shot, and published with creators your audience already trusts.
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/apply"
              className="group flex items-center gap-3 px-7 py-4 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all duration-200 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
            >
              Work with us
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <p className="text-xs text-white/30">
              Discovery call · No commitment
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-6 flex items-center justify-between">
        <p className="text-xs text-white/20">
          © {new Date().getFullYear()} The Content Farm Studios
        </p>
        <p className="text-xs text-white/20">
          thecontentfarm.co
        </p>
      </footer>
    </div>
  )
}
