import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return Response.redirect(`${origin}/admin?google_auth=error`)
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${origin}/api/auth/google/callback`
  )

  const { tokens } = await oauth2Client.getToken(code)

  if (!tokens.refresh_token) {
    return Response.redirect(`${origin}/admin?google_auth=no_refresh_token`)
  }

  // Store refresh token in settings table
  await adminSupabase
    .from('settings')
    .upsert({ key: 'google_refresh_token', value: tokens.refresh_token, updated_at: new Date().toISOString() })

  return Response.redirect(`${origin}/admin?google_auth=success`)
}
