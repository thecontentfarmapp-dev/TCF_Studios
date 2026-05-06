import { getAvailableSlots } from '@/lib/google/calendar'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const slots = await getAvailableSlots()
    return NextResponse.json({ slots })
  } catch (error: any) {
    console.error('Slots error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
