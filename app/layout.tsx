import type {Metadata} from 'next';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  title: 'Eternal Love - Our Wedding Album',
  description: 'A beautiful, interactive wedding album.',
  icons: {
    icon: '/fivicon.png',
    shortcut: '/fivicon.png',
    apple: '/fivicon.png',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="font-serif">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
