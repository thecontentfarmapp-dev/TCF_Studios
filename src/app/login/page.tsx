'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [mode, setMode] = useState<'password' | 'magic'>('password')

  const supabase = createClient()

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMessage(error.message)
      setLoading(false)
    } else {
      window.location.href = '/'
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email for a login link.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight gradient-text">TCF Studios</h1>
          <p className="text-sm text-muted-foreground">The Content Farm Studios</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-2xl">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Sign in</h2>
            <p className="text-sm text-muted-foreground">Access your production portal</p>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setMode('password')}
              className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${mode === 'password' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Password
            </button>
            <button
              onClick={() => setMode('magic')}
              className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${mode === 'magic' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Magic link
            </button>
          </div>

          <form onSubmit={mode === 'password' ? handlePasswordLogin : handleMagicLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {mode === 'password' && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            )}

            {message && (
              <p className={`text-sm ${message.includes('Check') ? 'text-green-400' : 'text-destructive'}`}>
                {message}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : mode === 'magic' ? 'Send magic link' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          TCF Studios Production Management System
        </p>
      </div>
    </div>
  )
}
