'use client';

import { motion, useInView } from 'framer-motion';
import { useMemo, useRef } from 'react';
import Image from 'next/image';

export interface PolaroidItem {
  id: string;
  src: string;
  caption: string;
  alt: string;
}

interface PositionedPolaroidItem extends PolaroidItem {
  rotation: number;
  x: number;
  y: number;
  scale: number;
  zIndex: number;
}

interface PhotoCollageSectionProps {
  items?: PolaroidItem[];
}

const FALLBACK_POLAROID_ITEMS: PolaroidItem[] = [
  {
    id: 'fallback-1',
    src: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
    caption: 'The first look',
    alt: 'The first look',
  },
  {
    id: 'fallback-2',
    src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80',
    caption: 'Details, weathered & wild',
    alt: 'Wedding details',
  },
  {
    id: 'fallback-3',
    src: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=900&q=80',
    caption: 'The whole crew',
    alt: 'Wedding crew',
  },
  {
    id: 'fallback-4',
    src: 'https://images.unsplash.com/photo-1520854221150-59d8ba7d571f?auto=format&fit=crop&w=900&q=80',
    caption: 'The trembling lip',
    alt: 'Emotional wedding moment',
  },
  {
    id: 'fallback-5',
    src: 'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?auto=format&fit=crop&w=900&q=80',
    caption: 'Lights & laughter',
    alt: 'Lights and laughter',
  },
  {
    id: 'fallback-6',
    src: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80',
    caption: 'Lavender & candlelight',
    alt: 'Lavender and candlelight',
  },
];

function hashString(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed: number) {
  let state = seed || 1;
  return () => {
    state = Math.imul(state ^ (state >>> 15), state | 1);
    state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
}

function overlaps(
  current: { x: number; y: number; w: number; h: number },
  other: { x: number; y: number; w: number; h: number }
) {
  return !(
    current.x + current.w < other.x ||
    current.x > other.x + other.w ||
    current.y + current.h < other.y ||
    current.y > other.y + other.h
  );
}

function buildDeterministicScatter(items: PolaroidItem[]): PositionedPolaroidItem[] {
  const placed: Array<{ x: number; y: number; w: number; h: number }> = [];

  return items.map((item, index) => {
    const rand = createSeededRandom(hashString(`${item.id}:${index}:${items.length}`));
    const width = 26;
    const height = 34;

    let bestX = 4 + rand() * 66;
    let bestY = 3 + rand() * 60;
    let accepted = false;

    for (let attempt = 0; attempt < 30; attempt += 1) {
      const candidateX = 4 + rand() * 66;
      const candidateY = 3 + rand() * 60;
      const candidate = { x: candidateX, y: candidateY, w: width, h: height };
      const hasHeavyOverlap = placed.some((other) => overlaps(candidate, other));

      if (!hasHeavyOverlap) {
        bestX = candidateX;
        bestY = candidateY;
        accepted = true;
        break;
      }

      if (!accepted) {
        bestX = candidateX;
        bestY = candidateY;
      }
    }

    const placedRect = { x: bestX, y: bestY, w: width, h: height };
    placed.push(placedRect);

    return {
      ...item,
      x: bestX,
      y: bestY,
      rotation: -10 + rand() * 20,
      scale: 0.94 + rand() * 0.14,
      zIndex: index + 1,
    };
  });
}

function PolaroidCard({ photo, index }: { photo: PositionedPolaroidItem; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        scale: 0.6,
        rotate: photo.rotation - 15,
        y: 24,
      }}
      animate={
        isInView
          ? {
              opacity: 1,
              scale: photo.scale,
              rotate: photo.rotation,
              y: 0,
            }
          : {}
      }
      transition={{
        duration: 0.8,
        delay: index * 0.12,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        scale: photo.scale + 0.08,
        rotate: 0,
        zIndex: 40,
        transition: { duration: 0.3, ease: 'easeOut' },
      }}
      className="absolute cursor-pointer group"
      style={{
        left: `${photo.x}%`,
        top: `${photo.y}%`,
        zIndex: photo.zIndex,
      }}
    >
      <div className="relative bg-white p-3 pb-16 shadow-2xl transition-shadow duration-300 group-hover:shadow-[0_25px_50px_rgba(0,0,0,0.3)]">
        <div className="relative w-48 h-56 sm:w-56 sm:h-64 md:w-64 md:h-72 overflow-hidden bg-stone-100">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 192px, (max-width: 768px) 224px, 256px"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="absolute bottom-4 left-0 right-0 text-center px-4">
          <p
            className="text-stone-600 text-sm italic font-serif"
            style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
          >
            {photo.caption}
          </p>
        </div>

        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/60 backdrop-blur-sm rotate-1 shadow-sm opacity-80" />
      </div>
    </motion.div>
  );
}

export default function PhotoCollageSection({ items }: PhotoCollageSectionProps) {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const sourceItems = items && items.length > 0 ? items : FALLBACK_POLAROID_ITEMS;
  const polaroidItems = useMemo(() => buildDeterministicScatter(sourceItems), [sourceItems]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen py-20 sm:py-32 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #f5f0e6 0%, #ebe4d6 50%, #f0ebe0 100%)',
      }}
    >
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-center mb-16 sm:mb-24 relative z-10 px-4"
      >
        <span className="text-xs sm:text-sm uppercase tracking-[0.2em] text-stone-500 font-sans font-medium mb-4 block">
          Cherished Moments
        </span>
        <h2 className="text-4xl sm:text-5xl md:text-6xl text-stone-800" style={{ fontFamily: "'Dancing Script', 'Great Vibes', cursive" }}>
          Our Love Story
        </h2>
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-stone-400 to-transparent mx-auto mt-6" />
      </motion.div>

      <div className="relative max-w-6xl mx-auto h-[600px] sm:h-[700px] md:h-[800px] px-4">
        {polaroidItems.map((photo, index) => (
          <PolaroidCard key={photo.id} photo={photo} index={index} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={isInView ? { opacity: 0.1, scale: 1 } : {}}
        transition={{ duration: 1.5, delay: 0.5 }}
        className="absolute top-20 right-10 w-40 h-40 rounded-full bg-rose-300 blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={isInView ? { opacity: 0.08, scale: 1 } : {}}
        transition={{ duration: 1.5, delay: 0.7 }}
        className="absolute bottom-20 left-10 w-32 h-32 rounded-full bg-amber-300 blur-3xl"
      />
    </section>
  );
}
