'use client';

import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function AppTooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  return <Tooltip><TooltipTrigger>{children}</TooltipTrigger><TooltipContent>{content}</TooltipContent></Tooltip>;
}
