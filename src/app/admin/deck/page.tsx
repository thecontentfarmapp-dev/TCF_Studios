import { createClient as createAdminClient } from '@supabase/supabase-js'
import { DEFAULT_DECK } from '@/lib/deck'
import DeckPresentation from './DeckPresentation'

const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function DeckPage() {
  const { data } = await adminSupabase
    .from('settings')
    .select('value')
    .eq('key', 'pitch_deck')
    .single()

  let deck = DEFAULT_DECK
  if (data?.value) {
    try { deck = JSON.parse(data.value) } catch {}
  }

  return <DeckPresentation deck={deck} />
}
