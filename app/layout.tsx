import type {Metadata} from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import { BackgroundMusic } from '@/components/BackgroundMusic';
import { GallerySettingsProvider } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'Eternal Love - Our Wedding Album',
  description: 'A beautiful, interactive wedding album.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body suppressHydrationWarning className="font-serif">
        <GallerySettingsProvider>
          {children}
        </GallerySettingsProvider>
        <BackgroundMusic />
      </body>
    </html>
  );
}
