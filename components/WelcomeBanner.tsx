'use client'

import { motion, AnimatePresence } from 'motion/react'
import { Heart, X, User } from 'lucide-react'
import { useState, useCallback } from 'react'

interface FamilyMember {
  id?: string
  email?: string
  name: string
  relationship: string | null
  welcome_message: string | null
  avatar_url: string | null
}

interface WelcomeBannerProps {
  member: FamilyMember | null
  onDismiss?: () => void
}

export default function WelcomeBanner({ member, onDismiss }: WelcomeBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => onDismiss?.(), 300)
  }, [onDismiss])

  if (!member) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="p-8 text-center">
              {/* Avatar */}
              <div className="relative inline-block mb-5">
                <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-stone-400" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white fill-white" />
                </div>
              </div>

              {/* Welcome text */}
              <p className="text-sm text-stone-500 uppercase tracking-widest mb-1">
                Welcome
              </p>
              
              <h2 className="text-3xl font-light text-stone-800 mb-2" style={{ fontFamily: "'Dancing Script', cursive, serif" }}>
                {member.name}
              </h2>

              {member.relationship && (
                <p className="text-sm text-rose-500 mb-4">
                  {member.relationship}
                </p>
              )}

              {/* Message */}
              <p className="text-stone-600 leading-relaxed mb-6">
                {member.welcome_message || `Welcome to our wedding gallery. We're so glad you're here.`}
              </p>

              {/* Button */}
              <button
                onClick={handleDismiss}
                className="w-full py-3 px-6 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors"
              >
                Enter Gallery
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
