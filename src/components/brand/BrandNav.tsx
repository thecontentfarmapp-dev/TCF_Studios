'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/supabase/types'

const navItems = [
  { href: '/brand', label: 'Overview', exact: true },
  { href: '/brand/episodes', label: 'Episodes' },
  { href: '/brand/approvals', label: 'Approvals' },
  { href: '/brand/content', label: 'Live Content' },
  { href: '/brand/invoices', label: 'Invoices' },
]

export default function BrandNav({ profile }: { profile: Profile & { brands: { company_name: string } | null } }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const brandName = profile.brands?.company_name || 'Brand Portal'

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">TCF</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-none">{brandName}</p>
              <p className="text-xs text-gray-500 mt-0.5">Brand Portal</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, exact }) => {
              const isActive = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
