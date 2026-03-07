'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Music2 } from 'lucide-react';

const BackgroundMusic = dynamic(
  () => import('@/components/BackgroundMusic').then((mod) => mod.BackgroundMusic),
  { ssr: false }
);

export default function GuestMusic() {
  const [enabled, setEnabled] = useState(false);

  if (!enabled) {
    return (
      <button
        type="button"
        onClick={() => setEnabled(true)}
        className="fixed bottom-6 right-6 z-[95] w-14 h-14 rounded-full bg-white/95 backdrop-blur-md border border-rose-200/60 shadow-lg flex items-center justify-center text-stone-600 hover:bg-rose-50 hover:text-rose-600 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-300"
        aria-label="Enable background music"
        title="Enable background music"
      >
        <Music2 className="w-6 h-6" />
      </button>
    );
  }

  return <BackgroundMusic />;
}
