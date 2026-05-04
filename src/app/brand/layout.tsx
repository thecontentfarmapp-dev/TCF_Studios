import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BrandNav from '@/components/brand/BrandNav'

export default async function BrandLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, brands(company_name)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'brand') redirect('/login')

  return (
    <div className="brand-portal min-h-screen bg-white">
      <BrandNav profile={profile} />
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
