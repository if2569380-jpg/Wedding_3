'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const LoginForm = dynamic(() => import('./LoginForm'), {
  ssr: false,
})

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#fdfcf8] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
