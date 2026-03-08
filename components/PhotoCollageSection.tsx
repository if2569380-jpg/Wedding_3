'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';

interface PolaroidPhoto {
  id: number;
  src: string;
  caption: string;
  rotation: number;
  x: number;
  y: number;
  scale: number;
  zIndex: number;
}

const polaroidPhotos: PolaroidPhoto[] = [
  {
    id: 1,
    src: 'https://yxcirytftaeyokldsphx.supabase.co/storage/v1/object/public/landing-public/collage/1772915075675-91429e08-5f6d-4f52-b7f5-4bb1dd4cd4d9.png',
    caption: 'The first look',
    rotation: -8,
    x: 5,
    y: 5,
    scale: 1,
    zIndex: 2,
  },
  {
    id: 2,
    src: 'https://yxcirytftaeyokldsphx.supabase.co/storage/v1/object/public/landing-public/collage/aeafc8ba-0cba-45de-9cd3-a71fefcc1a29.jfif',
    caption: 'Details, weathered & wild',
    rotation: 3,
    x: 35,
    y: 0,
    scale: 1.05,
    zIndex: 3,
  },
  {
    id: 3,
    src: 'https://yxcirytftaeyokldsphx.supabase.co/storage/v1/object/public/landing-public/collage/bbb683c6-89f5-4b83-8876-784782fb3e4a.jfif',
    caption: 'The whole crew',
    rotation: 5,
    x: 65,
    y: 8,
    scale: 1,
    zIndex: 1,
  },
  {
    id: 4,
    src: 'https://yxcirytftaeyokldsphx.supabase.co/storage/v1/object/public/landing-public/collage/1772916258195-675158db-9380-410e-91c4-9a4da4f0a196.jfif',
    caption: 'The trembling lip',
    rotation: -4,
    x: 10,
    y: 50,
    scale: 0.95,
    zIndex: 4,
  },
  {
    id: 5,
    src: 'https://yxcirytftaeyokldsphx.supabase.co/storage/v1/object/public/landing-public/collage/1772916240828-424a626d-93cf-41af-87bd-b05e485b182f.webp',
    caption: 'Lights & laughter',
    rotation: 7,
    x: 40,
    y: 45,
    scale: 1.02,
    zIndex: 5,
  },
  {
    id: 6,
    src: 'https://yxcirytftaeyokldsphx.supabase.co/storage/v1/object/public/landing-public/collage/1772915075675-91429e08-5f6d-4f52-b7f5-4bb1dd4cd4d9.png',
    caption: 'Lavender & candlelight',
    rotation: -2,
    x: 70,
    y: 48,
    scale: 0.98,
    zIndex: 2,
  },
];

function PolaroidCard({ photo, index }: { photo: PolaroidPhoto; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ 
        opacity: 0, 
        scale: 0.6,
        rotate: photo.rotation - 15,
        x: photo.x - 10,
        y: photo.y + 20,
      }}
      animate={isInView ? { 
        opacity: 1, 
        scale: photo.scale,
        rotate: photo.rotation,
        x: photo.x,
        y: photo.y,
      } : {}}
      transition={{
        duration: 0.8,
        delay: index * 0.15,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ 
        scale: photo.scale + 0.08, 
        rotate: 0,
        zIndex: 10,
        transition: { duration: 0.3, ease: 'easeOut' }
      }}
      className="absolute cursor-pointer group"
      style={{
        left: `${photo.x}%`,
        top: `${photo.y}%`,
        zIndex: photo.zIndex,
      }}
    >
      <div className="relative bg-white p-3 pb-16 shadow-2xl transition-shadow duration-300 group-hover:shadow-[0_25px_50px_rgba(0,0,0,0.3)]">
        {/* Photo */}
        <div className="relative w-48 h-56 sm:w-56 sm:h-64 md:w-64 md:h-72 overflow-hidden bg-stone-100">
          <Image
            src={photo.src}
            alt={photo.caption}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 192px, (max-width: 768px) 224px, 256px"
          />
          {/* Subtle vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        {/* Caption */}
        <div className="absolute bottom-4 left-0 right-0 text-center px-4">
          <p 
            className="text-stone-600 text-sm italic font-serif"
            style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
          >
            {photo.caption}
          </p>
        </div>

        {/* Tape effect (subtle) */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/60 backdrop-blur-sm rotate-1 shadow-sm opacity-80" />
      </div>
    </motion.div>
  );
}

export default function PhotoCollageSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-screen py-20 sm:py-32 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #f5f0e6 0%, #ebe4d6 50%, #f0ebe0 100%)',
      }}
    >
      {/* Subtle texture overlay */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-center mb-16 sm:mb-24 relative z-10 px-4"
      >
        <span className="text-xs sm:text-sm uppercase tracking-[0.2em] text-stone-500 font-sans font-medium mb-4 block">
          Cherished Moments
        </span>
        <h2 
          className="text-4xl sm:text-5xl md:text-6xl text-stone-800"
          style={{ fontFamily: "'Dancing Script', 'Great Vibes', cursive" }}
        >
          Our Love Story
        </h2>
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-stone-400 to-transparent mx-auto mt-6" />
      </motion.div>

      {/* Polaroid Grid Container */}
      <div className="relative max-w-6xl mx-auto h-[600px] sm:h-[700px] md:h-[800px] px-4">
        {polaroidPhotos.map((photo, index) => (
          <PolaroidCard key={photo.id} photo={photo} index={index} />
        ))}
      </div>

      {/* Decorative elements */}
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
