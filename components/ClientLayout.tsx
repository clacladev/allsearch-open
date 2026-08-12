'use client';

import { ReactNode } from 'react';
import NextTopLoader from 'nextjs-toploader';
import { Tooltip } from 'react-tooltip';
import { config } from '@/config';
import { RouteProvider } from '@/components/RouteProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';

const ClientLayout = ({ children }: { children: ReactNode }) => (
  <RouteProvider>
    <ThemeProvider>
      {/* Show a progress bar at the top when navigating between pages */}
      <NextTopLoader color={config.colors.main} showSpinner={false} />

      {children}

      {/* Show success/error messages anywhere from the app with Sonner. */}
      <Toaster toastOptions={{ duration: 3000 }} />

      {/* Show tooltips if any JSX elements has these 2 attributes: data-tooltip-id="tooltip" data-tooltip-content="" */}
      <Tooltip id="tooltip" className="z-60 max-w-sm opacity-100! shadow-lg" />
    </ThemeProvider>
  </RouteProvider>
);

export default ClientLayout;
