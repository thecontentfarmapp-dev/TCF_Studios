import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HomePage from '@/components/public/HomePage'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Authenticated users go straight to their portal
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'brand') redirect('/brand')
    if (profile?.role === 'creator') redirect('/creator')
    redirect('/admin')
  }

  // Everyone else sees the public homepage
  return <HomePage />
}
