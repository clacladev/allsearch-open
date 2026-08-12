'use client';

import type { ReactElement, ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function AppTooltip({ content, children }: { content: ReactNode; children: ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  );
}
