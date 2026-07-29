'use client';

import { useTheme } from 'next-themes';
import { Button, Props } from '@/components/base/buttons/button';
import { Monitor01, Moon01, Sun } from '@untitledui/icons';

export type Theme = 'light' | 'dark' | 'system';

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
      color="tertiary"
      size="md"
      iconLeading={nextTheme === 'light' ? Sun : nextTheme === 'dark' ? Moon01 : Monitor01}
      onClick={() => setTheme(nextTheme as string)}
      {...props}
    >
      Switch to {nextTheme ?? 'system'}
    </Button>
  );
}

export function ThemeToggleCompactButton(props: Props) {
  const { theme, setTheme } = useTheme();
  const nextTheme = getNextTheme(theme);
  return (
    <Button
      aria-label="Toggle theme"
      color="tertiary"
      size="sm"
      iconLeading={nextTheme === 'light' ? Sun : nextTheme === 'dark' ? Moon01 : Monitor01}
      onClick={() => setTheme(nextTheme as string)}
      {...props}
    />
  );
}
