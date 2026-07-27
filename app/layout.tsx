import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { Metadata, Viewport } from 'next';
import { getSEOTags } from '@/libs/seo';
import { GoogleTagManager } from '@next/third-parties/google';
import '@/styles/globals.css';

// No more than 4-6 preconnects
const PRECONNECT_ORIGINS: string[] = [
  'https://eu.i.posthog.com',
  'https://vitals.vercel-insights.com',
  'https://va.vercel-scripts.com',
  'https://client.crisp.chat',
  'https://storage.crisp.chat',
  'https://www.googletagmanager.com',
];

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  colorScheme: 'light',
};

export const metadata: Metadata = getSEOTags();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`} suppressHydrationWarning>
      <head>
        {/* Preconnect to required origins for better performance */}
        {PRECONNECT_ORIGINS.map((origin) => (
          <link key={origin} rel="preconnect" href={origin} />
        ))}
      </head>

      {process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID && (
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID} />
      )}

      {children}
    </html>
  );
}
