'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/supabase/types'
import {
  LayoutDashboard,
  Building2,
  Users,
  Film,
  Clapperboard,
  FileText,
  Calendar,
  Receipt,
  BarChart3,
  LogOut,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/brands', label: 'Brands', icon: Building2 },
  { href: '/admin/creators', label: 'Creators', icon: Users },
  { href: '/admin/seasons', label: 'Seasons', icon: Film },
  { href: '/admin/episodes', label: 'Episodes', icon: Clapperboard },
  { href: '/admin/scripts', label: 'Scripts', icon: FileText },
  { href: '/admin/shoots', label: 'Shoot Days', icon: Calendar },
  { href: '/admin/invoices', label: 'Invoices', icon: Receipt },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function AdminSidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">TCF</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground leading-none">TCF Studios</p>
            <p className="text-xs text-muted-foreground mt-0.5">Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-accent-foreground'}`} />
              {label}
              {isActive && <ChevronRight className="w-3 h-3 ml-auto text-primary" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-sidebar-foreground truncate">{profile.full_name || 'Admin'}</p>
          <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
