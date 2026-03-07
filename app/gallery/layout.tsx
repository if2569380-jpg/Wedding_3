import type { ReactNode } from 'react';
import { GallerySettingsProvider } from '@/app/providers';
import GuestMusic from '@/components/GuestMusic';
import SessionRedirectGuard from '@/components/SessionRedirectGuard';

export default function GalleryLayout({ children }: { children: ReactNode }) {
  return (
    <GallerySettingsProvider>
      <SessionRedirectGuard />
      {children}
      <GuestMusic />
    </GallerySettingsProvider>
  );
}
