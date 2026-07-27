'use client';

import { ReactNode } from 'react';
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from 'react-hot-toast';
import { Tooltip } from 'react-tooltip';
import { config } from '@/config';
import CrispChat from './CrispChat';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import { RouteProvider } from '@/components/RouteProvider';
import { ThemeProvider } from '@/components/ThemeProvider';

const ClientLayout = ({ children }: { children: ReactNode }) => (
  <RouteProvider>
    <ThemeProvider>
      {/* Vercel Analytics */}
      <Analytics />

      {/* Vercel Speed Insights */}
      <SpeedInsights />

      {/* Show a progress bar at the top when navigating between pages */}
      <NextTopLoader color={config.colors.main} showSpinner={false} />

      {/* Content inside app/page.js files  */}
      {children}

      {/* Show Success/Error messages anywhere from the app with toast() */}
      <Toaster toastOptions={{ duration: 3000 }} />

      {/* Show tooltips if any JSX elements has these 2 attributes: data-tooltip-id="tooltip" data-tooltip-content="" */}
      <Tooltip id="tooltip" className="z-60 max-w-sm opacity-100! shadow-lg" />

      {/* Set Crisp customer chat support */}
      <CrispChat />
    </ThemeProvider>
  </RouteProvider>
);

export default ClientLayout;
