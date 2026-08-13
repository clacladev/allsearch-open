'use client';

import type { ReactNode } from 'react';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { AppLogo } from '@/components/AppLogo';
import { ROUTES } from '@/libs/routes';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetCloseButton } from '@/components/ui/sheet';

export function MobileNavigation({ children }: { children: ReactNode }) {
 return <Sheet><header className="flex h-16 items-center justify-between border-b border-border px-4 lg:hidden"><Link href={ROUTES.DASHBOARD} aria-label="Dashboard"><AppLogo /></Link><SheetTrigger aria-label="Expand navigation menu" render={<Button variant="ghost" size="icon" />}><Menu /></SheetTrigger></header><SheetContent aria-label="Navigation menu" className="p-4 lg:hidden"><SheetTitle className="sr-only">Navigation menu</SheetTitle><SheetCloseButton label="Close navigation menu" />{children}</SheetContent></Sheet>;
}
