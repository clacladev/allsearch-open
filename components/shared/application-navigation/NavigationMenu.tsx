'use client';

import Link from 'next/link';
import { cn } from '@/libs/utils/cn';
import { AppTooltip } from '@/components/shared/tooltip';
import type { NavigationItem } from './navigation-types';

export function NavigationMenu({ items, pathname, onNavigate }: { items: NavigationItem[]; pathname: string; onNavigate?: () => void }) {
  return <nav aria-label="Project navigation" className="mt-4 px-2 lg:px-4"><ul className="flex flex-col">{items.map(({ label, href, icon: Icon }) => { const current = pathname === href || (label === 'Overview' && pathname === href.split('?')[0]); return <li key={label} className="py-0.5"><AppTooltip content={label}><Link href={href} onClick={onNavigate} aria-current={current ? 'page' : undefined} className={cn('group flex w-full items-center rounded-md bg-background px-3 py-2 text-sm font-semibold text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring', current && 'bg-muted text-foreground hover:bg-secondary')}><Icon aria-hidden="true" className="mr-2 size-5 shrink-0 stroke-[1.75] text-muted-foreground transition-colors group-hover:text-foreground" /><span className="flex-1 truncate">{label}</span></Link></AppTooltip></li>; })}</ul></nav>;
}
