'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { motion } from 'motion/react'
import { Heart } from 'lucide-react'
import Link from 'next/link'

const LoginForm = dynamic(() => import('./LoginForm'), {
  ssr: false,
})

export default function LoginPage() {
  return (
    <main className="h-screen bg-[#fdfcf8] flex overflow-hidden">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-6">
        {/* Logo/Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <Link href="/" className="inline-flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-400" />
            <span
              className="text-2xl text-stone-800"
              style={{ fontFamily: "'Dancing Script', cursive" }}
            >
              Laboni & Adnan Arif
            </span>
          </Link>
        </motion.div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-md mx-auto lg:mx-0"
        >
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </motion.div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <Image
            src="https://yxcirytftaeyokldsphx.supabase.co/storage/v1/object/sign/gallery/full/hero-image-1772817907417.jfif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMjVmMGY5MS0xY2M5LTQwOGEtOTM4MS04YTE2ZjViNDIyNjgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYWxsZXJ5L2Z1bGwvaGVyby1pbWFnZS0xNzcyODE3OTA3NDE3LmpmaWYiLCJpYXQiOjE3NzI4MTc5MjAsImV4cCI6MTc3MjgyMTUyMH0.QD33c9HjVHFSkuCmKbn6kWksl0AxxruJoLQRjroLk_4"
            alt="Wedding couple"
            fill
            className="object-cover"
            priority
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-l from-black/30 via-black/10 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-white"
          >
            <p
              className="text-3xl md:text-4xl font-light mb-3"
              style={{ fontFamily: "'Dancing Script', cursive" }}
            >
              Our Wedding Gallery
            </p>
            <p className="text-white/80 text-sm font-sans tracking-wide">
              Capturing moments, creating memories
            </p>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-12 right-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2"
          >
            <Heart className="w-4 h-4 text-rose-400" fill="currentColor" />
            <span className="text-white/90 text-xs font-sans tracking-wider">Private Gallery</span>
          </motion.div>
        </div>
      </div>
    </main>
  )
}
