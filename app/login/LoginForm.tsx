'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseBrowser'
import { Lock, Mail, ArrowRight, Heart } from 'lucide-react'
import Link from 'next/link'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [redirectUrl, setRedirectUrl] = useState('/gallery')

  useEffect(() => {
    // Get redirect URL from query params on client side only
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const redirect = params.get('redirectedFrom')
      if (redirect) {
        setRedirectUrl(redirect)
      }
    }
  }, [])

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
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stone-100 mb-4">
          <Heart className="w-8 h-8 text-rose-400" />
        </div>
        <h1 className="text-3xl font-serif font-light text-stone-800 mb-2">
          Welcome Back
        </h1>
        <p className="text-stone-600 font-sans">
          Sign in to view the wedding gallery
        </p>
      </div>

      {/* Login Form */}
      <div className="bg-white rounded-2xl shadow-lg border border-stone-100 p-8">
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

        <form onSubmit={handleLogin} className="space-y-6">
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
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
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
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-stone-800 text-white py-3 px-6 rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

        <div className="mt-6 pt-6 border-t border-stone-100 text-center">
          <Link href="/" className="text-stone-600 hover:text-stone-800 text-sm transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>

      <p className="text-center text-stone-500 text-sm mt-8">
        This gallery is private and requires authentication.
      </p>
    </>
  )
}
