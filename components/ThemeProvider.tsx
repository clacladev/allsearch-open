'use client';

import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { type PropsWithChildren } from 'react';

export function ThemeProvider({ children }: PropsWithChildren) {
  return (
    <NextThemeProvider
      disableTransitionOnChange
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      value={{ light: 'light-mode', dark: 'dark-mode' }}
    >
      {children}
    </NextThemeProvider>
  );
}
