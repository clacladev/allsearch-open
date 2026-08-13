'use client';

import { ReactNode } from 'react';
import NextTopLoader from 'nextjs-toploader';
import { config } from '@/config';
import { RouteProvider } from '@/components/RouteProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

const ClientLayout = ({ children }: { children: ReactNode }) => (
  <RouteProvider>
    <ThemeProvider>
      <TooltipProvider delay={300}>
      {/* Show a progress bar at the top when navigating between pages */}
      <NextTopLoader color={config.colors.main} showSpinner={false} />

      {children}

      {/* Show success/error messages anywhere from the app with Sonner. */}
      <Toaster toastOptions={{ duration: 3000 }} />

      </TooltipProvider>
    </ThemeProvider>
  </RouteProvider>
);

export default ClientLayout;
