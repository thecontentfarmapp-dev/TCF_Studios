'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Profile } from '@/lib/supabase/types'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  LayoutDashboard, Building2, Users, Film, Clapperboard,
  FileText, Calendar, Receipt, BarChart3, LogOut, Menu, Video,
} from 'lucide-react'

const navItems = [
  { href: '/admin',            label: 'Dashboard',       icon: LayoutDashboard, exact: true },
  { href: '/admin/brands',     label: 'Brands',          icon: Building2 },
  { href: '/admin/creators',   label: 'Creators',        icon: Users },
  { href: '/admin/seasons',    label: 'Seasons',         icon: Film },
  { href: '/admin/episodes',   label: 'Episodes',        icon: Clapperboard },
  { href: '/admin/scripts',    label: 'Scripts',         icon: FileText },
  { href: '/admin/shoots',     label: 'Shoot Days',      icon: Calendar },
  { href: '/admin/bookings',   label: 'Discovery Calls', icon: Video },
  { href: '/admin/invoices',   label: 'Invoices',        icon: Receipt },
  { href: '/admin/analytics',  label: 'Analytics',       icon: BarChart3 },
]

function NavContent({
  profile,
  pathname,
  onNavigate,
}: {
  profile: Profile
  pathname: string
  onNavigate?: () => void
}) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-white flex items-center justify-center flex-shrink-0">
            <span className="text-black text-[10px] font-black tracking-tight leading-none">TCF</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground leading-none tracking-tight">TCF Studios</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-widest">Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-px overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
              }`}
            >
              {/* Active indicator — left border */}
              {isActive && (
                <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary" />
              )}
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-accent-foreground'}`} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-2 py-3 border-t border-sidebar-border flex-shrink-0">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-medium text-sidebar-foreground truncate">{profile.full_name || 'Admin'}</p>
          <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function AdminSidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col h-full bg-sidebar border-r border-sidebar-border">
        <NavContent profile={profile} pathname={pathname} />
      </aside>

      {/* Mobile — Sheet drawer */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 h-14 bg-sidebar border-b border-sidebar-border">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label="Open navigation"
            className="p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Menu className="w-5 h-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-56 p-0 bg-sidebar border-sidebar-border">
            <NavContent
              profile={profile}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-white flex items-center justify-center flex-shrink-0">
            <span className="text-black text-[9px] font-black tracking-tight">TCF</span>
          </div>
          <span className="text-sm font-semibold text-sidebar-foreground">TCF Studios</span>
        </div>
      </div>
    </>
  )
}
