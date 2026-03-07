'use client'

import { useCallback, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseBrowser'

export default function SessionRedirectGuard() {
  const router = useRouter()
  const pathname = usePathname()
  const redirectingRef = useRef(false)

  const redirectToLogin = useCallback(() => {
    if (redirectingRef.current) return
    redirectingRef.current = true

    const query = new URLSearchParams()
    if (pathname) {
      query.set('redirectedFrom', pathname)
    }

    const search = query.toString()
    router.replace(search ? `/login?${search}` : '/login')
    router.refresh()
  }, [pathname, router])

  useEffect(() => {
    const supabase = createClient()

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        redirectToLogin()
      }
    }

    void checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session || event === 'SIGNED_OUT') {
        redirectToLogin()
      }
    })

    const handleFocus = () => {
      void checkSession()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkSession()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const sessionCheckInterval = window.setInterval(() => {
      void checkSession()
    }, 60_000)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.clearInterval(sessionCheckInterval)
    }
  }, [redirectToLogin])

  return null
}
