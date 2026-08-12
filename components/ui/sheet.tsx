'use client';

import { Dialog as SheetPrimitive } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { cn } from '@/libs/utils/cn';
import { Button } from '@/components/ui/button';

function Sheet(props: SheetPrimitive.Root.Props) { return <SheetPrimitive.Root data-slot="sheet" {...props} />; }
function SheetTrigger(props: SheetPrimitive.Trigger.Props) { return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />; }
function SheetClose(props: SheetPrimitive.Close.Props) { return <SheetPrimitive.Close data-slot="sheet-close" {...props} />; }
function SheetContent({ className, children, side = 'left', ...props }: SheetPrimitive.Popup.Props & { side?: 'top' | 'right' | 'bottom' | 'left' }) {
  return <SheetPrimitive.Portal data-slot="sheet-portal"><SheetPrimitive.Backdrop data-slot="sheet-overlay" className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" /><SheetPrimitive.Popup data-slot="sheet-content" data-side={side} className={cn('fixed inset-y-0 left-0 z-50 flex w-72 max-w-[calc(100vw-4rem)] flex-col bg-popover text-popover-foreground shadow-lg outline-hidden transition duration-200 data-ending-style:-translate-x-10 data-starting-style:-translate-x-10', className)} {...props}>{children}</SheetPrimitive.Popup></SheetPrimitive.Portal>;
}
function SheetTitle(props: SheetPrimitive.Title.Props) { return <SheetPrimitive.Title data-slot="sheet-title" {...props} />; }
function SheetDescription(props: SheetPrimitive.Description.Props) { return <SheetPrimitive.Description data-slot="sheet-description" {...props} />; }
function SheetCloseButton() { return <SheetPrimitive.Close render={<Button variant="ghost" size="icon-sm" aria-label="Close navigation menu" className="absolute right-2 top-2" />}><X /><span className="sr-only">Close navigation menu</span></SheetPrimitive.Close>; }
export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle, SheetDescription, SheetCloseButton };
