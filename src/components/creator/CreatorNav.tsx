'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/supabase/types'

const navItems = [
  { href: '/creator', label: 'Season', exact: true },
  { href: '/creator/scripts', label: 'Scripts' },
  { href: '/creator/schedule', label: 'Schedule' },
  { href: '/creator/episodes', label: 'Episodes' },
  { href: '/creator/content', label: 'Live Content' },
]

export default function CreatorNav({ profile }: { profile: Profile & { creators: { name: string } | null } }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const name = profile.creators?.name || profile.full_name || 'Creator'

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="border-b border-border bg-background sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">TCF</span>
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">{name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Creator Portal</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, exact }) => {
              const isActive = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          <button
            onClick={handleSignOut}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
