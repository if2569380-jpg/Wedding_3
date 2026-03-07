import type {Metadata} from 'next';
import { Manrope, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

const manrope = Manrope({
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
    <html lang="en" className={`${manrope.variable} ${cormorant.variable}`}>
      <body suppressHydrationWarning className="font-serif">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
