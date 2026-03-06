'use client';

import dynamic from 'next/dynamic';

const BackgroundMusic = dynamic(
  () => import('@/components/BackgroundMusic').then((mod) => mod.BackgroundMusic),
  { ssr: false }
);

export default function GuestMusic() {
  return <BackgroundMusic />;
}
