import type { ReactNode } from 'react';
import { GallerySettingsProvider } from '@/app/providers';
import GuestMusic from '@/components/GuestMusic';

export default function GalleryLayout({ children }: { children: ReactNode }) {
  return (
    <GallerySettingsProvider>
      {children}
      <GuestMusic />
    </GallerySettingsProvider>
  );
}
