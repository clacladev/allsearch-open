'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { ComponentProps } from 'react';

export type Theme = 'light' | 'dark' | 'system';
type Props = ComponentProps<typeof Button>;

const THEMES: Theme[] = ['light', 'dark', 'system'];

function getNextTheme(theme: string | undefined): Theme {
  const index = THEMES.indexOf(theme as Theme);
  const nextIndex = (index + 1) % THEMES.length;
  return THEMES[nextIndex];
}

export function ThemeToggleButton(props: Props) {
  const { theme, setTheme } = useTheme();
  const nextTheme = getNextTheme(theme);
  return (
    <Button
      aria-label="Toggle theme"
      variant="ghost"
      size="default"
      onClick={() => setTheme(nextTheme as string)}
      {...props}
    >
      {nextTheme === 'light' ? <Sun /> : nextTheme === 'dark' ? <Moon /> : <Monitor />} Switch to {nextTheme ?? 'system'}
    </Button>
  );
}

export function ThemeToggleCompactButton(props: Props) {
  const { theme, setTheme } = useTheme();
  const nextTheme = getNextTheme(theme);
  return (
    <Button
      aria-label="Toggle theme"
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(nextTheme as string)}
      {...props}
    >{nextTheme === 'light' ? <Sun /> : nextTheme === 'dark' ? <Moon /> : <Monitor />}</Button>
  );
}
