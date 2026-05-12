import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { DEFAULT_DECK } from '@/lib/deck'

const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data } = await adminSupabase
    .from('settings')
    .select('value')
    .eq('key', 'pitch_deck')
    .single()

  if (!data?.value) return NextResponse.json(DEFAULT_DECK)
  try {
    return NextResponse.json(JSON.parse(data.value))
  } catch {
    return NextResponse.json(DEFAULT_DECK)
  }
}

export async function PUT(req: Request) {
  const deck = await req.json()
  await adminSupabase
    .from('settings')
    .upsert({ key: 'pitch_deck', value: JSON.stringify(deck), updated_at: new Date().toISOString() })
  return NextResponse.json({ success: true })
}
