'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseBrowser'
import { Lock, Mail, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { EmailOtpType } from '@supabase/supabase-js'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [redirectUrl, setRedirectUrl] = useState('/gallery')
  const [showSetPasswordDialog, setShowSetPasswordDialog] = useState(false)
  const [invitePassword, setInvitePassword] = useState('')
  const [confirmInvitePassword, setConfirmInvitePassword] = useState('')
  const [inviteChecking, setInviteChecking] = useState(false)
  const [inviteSaving, setInviteSaving] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const recordLoginEvent = async () => {
    const payload = JSON.stringify({ eventType: 'login' })

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const body = new Blob([payload], { type: 'application/json' })
      const queued = navigator.sendBeacon('/api/analytics/event', body)
      if (queued) {
        return
      }
    }

    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    })
  }

  useEffect(() => {
    // Get redirect URL from query params on client side only
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const redirect = params.get('redirectedFrom')
      if (redirect) {
        setRedirectUrl(redirect)
      }

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const queryType = params.get('type') as EmailOtpType | null
      const hashType = hashParams.get('type') as EmailOtpType | null
      const flowType = queryType ?? hashType
      const tokenHash = params.get('token_hash')
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const code = params.get('code')

      const isInviteFlow =
        flowType === 'invite' ||
        (tokenHash !== null && queryType === 'invite') ||
        (accessToken !== null && refreshToken !== null && hashType === 'invite') ||
        (code !== null && queryType === 'invite')

      if (!isInviteFlow) return

      const setupInviteSession = async () => {
        setInviteChecking(true)
        setInviteError(null)
        setError(null)

        try {
          const supabase = createClient()

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (sessionError) {
              throw sessionError
            }
          } else if (code) {
            const { error: codeError } = await supabase.auth.exchangeCodeForSession(code)
            if (codeError) {
              throw codeError
            }
          } else if (tokenHash && flowType) {
            const { error: otpError } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: flowType,
            })

            if (otpError) {
              throw otpError
            }
          } else {
            throw new Error('Invitation link is missing required tokens.')
          }

          const {
            data: { session },
          } = await supabase.auth.getSession()

          if (!session) {
            throw new Error('Invitation link is invalid or expired.')
          }

          const cleanParams = new URLSearchParams()
          const redirectedFrom = params.get('redirectedFrom')
          if (redirectedFrom) {
            cleanParams.set('redirectedFrom', redirectedFrom)
          }

          const cleanQuery = cleanParams.toString()
          const cleanUrl = cleanQuery
            ? `${window.location.pathname}?${cleanQuery}`
            : window.location.pathname
          window.history.replaceState({}, '', cleanUrl)

          setShowSetPasswordDialog(true)
        } catch (inviteFlowError) {
          const messageText =
            inviteFlowError instanceof Error
              ? inviteFlowError.message
              : 'Failed to verify invitation. Please retry from the invite email.'
          setInviteError(messageText)
        } finally {
          setInviteChecking(false)
        }
      }

      void setupInviteSession()
    }
  }, [])

  const handleSetInvitePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError(null)

    if (invitePassword.length < 8) {
      setInviteError('Password must be at least 8 characters long.')
      return
    }

    if (invitePassword !== confirmInvitePassword) {
      setInviteError('Passwords do not match.')
      return
    }

    setInviteSaving(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password: invitePassword,
      })

      if (updateError) {
        setInviteError(updateError.message)
        return
      }

      setShowSetPasswordDialog(false)
      setMessage('Password set successfully! Redirecting...')
      try {
        await recordLoginEvent()
      } catch {
        // Login tracking is best effort only.
      }
      window.location.href = redirectUrl
    } catch {
      setInviteError('Could not set password. Please try again.')
    } finally {
      setInviteSaving(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      if (data.session) {
        setMessage('Login successful! Redirecting...')
        try {
          await recordLoginEvent()
        } catch {
          // Login tracking is best effort only.
        }
        // Use window.location for redirect instead of router
        window.location.href = redirectUrl
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-serif font-medium text-stone-900 mb-1">
          Welcome Back
        </h1>
        <p className="text-stone-600 font-sans text-sm">
          Sign in to view the wedding gallery
        </p>
      </div>

      {/* Login Form */}
      <div className="bg-white/95 rounded-2xl shadow-xl shadow-stone-300/45 border border-stone-200 p-5 sm:p-6 backdrop-blur-sm">
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-stone-700 mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full min-h-11 pl-10 pr-4 py-2.5 rounded-lg border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-stone-700 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full min-h-11 pl-10 pr-4 py-2.5 rounded-lg border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-11 flex items-center justify-center gap-2 bg-stone-800 text-white py-2.5 px-6 rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-stone-100 text-center">
          <Link href="/" className="text-stone-600 hover:text-stone-800 text-sm transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>

      <p className="text-center text-stone-500 text-xs mt-5 sm:mt-6">
        This gallery is private and requires authentication.
      </p>

      {showSetPasswordDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4">
          <div className="w-full max-w-md max-h-[90svh] overflow-y-auto rounded-2xl bg-white border border-stone-200 shadow-2xl p-5 sm:p-6">
            <h2 className="text-xl font-serif font-medium text-stone-900 mb-1">
              Set Your Password
            </h2>
            <p className="text-sm text-stone-600 mb-5">
              Invitation accepted. Set a password for future logins.
            </p>

            {inviteError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-sm">
                {inviteError}
              </div>
            )}

            <form onSubmit={handleSetInvitePassword} className="space-y-4">
              <div>
                <label
                  htmlFor="invite-password"
                  className="block text-sm font-medium text-stone-700 mb-2"
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    id="invite-password"
                    type="password"
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full min-h-11 pl-10 pr-4 py-2.5 rounded-lg border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
                    placeholder="Minimum 8 characters"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="invite-confirm-password"
                  className="block text-sm font-medium text-stone-700 mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    id="invite-confirm-password"
                    type="password"
                    value={confirmInvitePassword}
                    onChange={(e) => setConfirmInvitePassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full min-h-11 pl-10 pr-4 py-2.5 rounded-lg border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
                    placeholder="Re-enter your password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={inviteSaving || inviteChecking}
                className="w-full min-h-11 flex items-center justify-center gap-2 bg-stone-800 text-white py-2.5 px-6 rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inviteSaving || inviteChecking ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Save Password'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
