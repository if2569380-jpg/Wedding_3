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

const stagger = {
  container: {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } },
  },
  item: {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
  },
}

export default function WelcomeBanner({ member, onDismiss }: WelcomeBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => onDismiss?.(), 400)
  }, [onDismiss])

  if (!member) return null

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@300;400;500&display=swap');

        .wb-name {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 300;
          font-style: italic;
          letter-spacing: 0.01em;
        }
        .wb-label {
          font-family: 'Jost', sans-serif;
          font-weight: 300;
          letter-spacing: 0.3em;
          font-size: 0.65rem;
          text-transform: uppercase;
        }
        .wb-body {
          font-family: 'Jost', sans-serif;
          font-weight: 300;
        }
        .wb-btn {
          font-family: 'Jost', sans-serif;
          font-weight: 400;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-size: 0.7rem;
        }
        .wb-gold-line {
          background: linear-gradient(90deg, transparent, #c9a96e 30%, #e8d5a3 50%, #c9a96e 70%, transparent);
        }
        .wb-card {
          background: linear-gradient(160deg, #fdfaf5 0%, #faf6ee 50%, #f7f2e8 100%);
        }
        .wb-overlay {
          background: radial-gradient(ellipse at center, rgba(10,8,5,0.55) 0%, rgba(5,4,2,0.75) 100%);
        }
        .wb-avatar-ring {
          background: linear-gradient(135deg, #c9a96e, #e8d5a3, #c9a96e);
        }
        .wb-enter-btn {
          background: linear-gradient(135deg, #1a1510 0%, #2d2318 100%);
          border: 1px solid rgba(201,169,110,0.3);
          transition: all 0.3s ease;
        }
        .wb-enter-btn:hover {
          background: linear-gradient(135deg, #c9a96e 0%, #b8934a 100%);
          border-color: transparent;
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(201,169,110,0.35);
        }
        .wb-close-btn:hover {
          color: #c9a96e;
          background: rgba(201,169,110,0.08);
        }
        .wb-noise {
          position: absolute;
          inset: 0;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 128px 128px;
          pointer-events: none;
          border-radius: inherit;
        }
      `}</style>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="wb-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            onClick={handleDismiss}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="wb-card relative w-full max-w-sm rounded-3xl overflow-hidden"
              style={{
                boxShadow: '0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(201,169,110,0.18), inset 0 1px 0 rgba(255,255,255,0.9)',
              }}
            >
              {/* Noise texture */}
              <div className="wb-noise" />

              {/* Top gold accent bar */}
              <div className="wb-gold-line h-px w-full" />

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="wb-close-btn wb-label absolute top-5 right-5 p-2 text-stone-400 rounded-full transition-all duration-200"
                style={{ fontSize: '0.6rem', letterSpacing: '0.2em' }}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Main content */}
              <motion.div
                className="px-10 pt-12 pb-10 flex flex-col items-center text-center"
                variants={stagger.container}
                initial="hidden"
                animate="show"
              >
                {/* Avatar */}
                <motion.div variants={stagger.item} className="relative mb-8">
                  {/* Gold ring */}
                  <div
                    className="wb-avatar-ring p-[2px] rounded-full"
                    style={{ boxShadow: '0 0 20px rgba(201,169,110,0.25)' }}
                  >
                    <div className="w-20 h-20 rounded-full bg-stone-100 overflow-hidden flex items-center justify-center">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-9 h-9 text-stone-300" />
                      )}
                    </div>
                  </div>

                  {/* Heart badge */}
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.6, duration: 0.4, type: 'spring', stiffness: 260 }}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #c9a96e, #b8934a)',
                      boxShadow: '0 2px 10px rgba(184,147,74,0.5)',
                    }}
                  >
                    <Heart className="w-3.5 h-3.5 text-white fill-white" />
                  </motion.div>
                </motion.div>

                {/* Welcome label */}
                <motion.p variants={stagger.item} className="wb-label text-stone-400 mb-3">
                  Welcome
                </motion.p>

                {/* Name */}
                <motion.h2
                  variants={stagger.item}
                  className="wb-name text-stone-800 mb-1"
                  style={{ fontSize: 'clamp(2rem, 6vw, 2.6rem)', lineHeight: 1.1 }}
                >
                  {member.name}
                </motion.h2>

                {/* Gold divider */}
                <motion.div
                  variants={stagger.item}
                  className="wb-gold-line h-px my-4"
                  style={{ width: '4rem' }}
                />

                {/* Relationship */}
                {member.relationship && (
                  <motion.p
                    variants={stagger.item}
                    className="wb-label mb-5"
                    style={{ color: '#c9a96e' }}
                  >
                    {member.relationship}
                  </motion.p>
                )}

                {/* Message */}
                <motion.p
                  variants={stagger.item}
                  className="wb-body text-stone-500 leading-relaxed mb-8 text-sm"
                >
                  {member.welcome_message ||
                    `We're so glad you're here to celebrate with us. Welcome to our wedding gallery.`}
                </motion.p>

                {/* CTA Button */}
                <motion.button
                  variants={stagger.item}
                  onClick={handleDismiss}
                  className="wb-enter-btn wb-btn w-full py-3.5 px-6 text-white rounded-xl"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Enter Gallery
                </motion.button>

                {/* Small ornament */}
                <motion.p
                  variants={stagger.item}
                  className="wb-label text-stone-300 mt-5 text-center"
                  style={{ fontSize: '0.55rem', letterSpacing: '0.25em' }}
                >
                  ✦ &nbsp; with love &nbsp; ✦
                </motion.p>
              </motion.div>

              {/* Bottom gold accent bar */}
              <div className="wb-gold-line h-px w-full" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}