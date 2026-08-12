'use client';

import Link from 'next/link';
import { cn } from '@/libs/utils/cn';
import { AppTooltip } from '@/components/shared/tooltip';
import type { NavigationItem } from './navigation-types';

export function NavigationMenu({ items, pathname, onNavigate }: { items: NavigationItem[]; pathname: string; onNavigate?: () => void }) {
  return <nav aria-label="Project navigation" className="mt-4 px-2 lg:px-4"><ul className="flex flex-col gap-1">{items.map(({ label, href, icon: Icon }) => { const current = pathname === href || (label === 'Overview' && pathname === href.split('?')[0]); return <li key={label}><AppTooltip content={label}><Link href={href} onClick={onNavigate} aria-current={current ? 'page' : undefined} className={cn('flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring', current && 'bg-muted text-foreground')}><Icon aria-hidden="true" className="size-5" /><span>{label}</span></Link></AppTooltip></li>; })}</ul></nav>;
}
