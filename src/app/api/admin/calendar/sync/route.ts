import { syncBookingsWithGoogle } from '@/lib/google/sync'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const result = await syncBookingsWithGoogle()
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Calendar sync error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
