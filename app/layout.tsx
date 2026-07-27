import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { Metadata, Viewport } from 'next';
import { config } from '@/config';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  colorScheme: 'light',
};

// The app runs on localhost and is never crawled, so there is no SEO metadata
// and no preconnects: every third-party origin they pointed at is gone.
export const metadata: Metadata = {
  title: config.appName,
  description: config.appDescription,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`} suppressHydrationWarning>
      {children}
    </html>
  );
}
