import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CreatorNav from '@/components/creator/CreatorNav'

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, creators(name)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'creator') redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      <CreatorNav profile={profile} />
      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
