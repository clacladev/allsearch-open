'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { cn } from '@/libs/utils/cn';
import { Button } from '@/components/ui/button';

const Dialog = (props: DialogPrimitive.Root.Props) => <DialogPrimitive.Root data-slot="dialog" {...props} />;
const DialogTrigger = (props: DialogPrimitive.Trigger.Props) => <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
const DialogClose = (props: DialogPrimitive.Close.Props) => <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
function DialogContent({ className, children, ...props }: DialogPrimitive.Popup.Props) {
  return <DialogPrimitive.Portal><DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" /><DialogPrimitive.Popup data-slot="dialog-content" className={cn('fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-lg bg-popover p-6 text-popover-foreground shadow-lg outline-hidden sm:max-h-[calc(100vh-4rem)]', className)} {...props}>{children}</DialogPrimitive.Popup></DialogPrimitive.Portal>;
}
const DialogTitle = (props: DialogPrimitive.Title.Props) => <DialogPrimitive.Title data-slot="dialog-title" className="text-lg font-semibold" {...props} />;
const DialogDescription = ({ className, ...props }: DialogPrimitive.Description.Props) => <DialogPrimitive.Description data-slot="dialog-description" className={cn('text-sm text-muted-foreground', className)} {...props} />;
function DialogCloseButton({ label = 'Close dialog' }: { label?: string }) { return <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" aria-label={label} className="absolute top-3 right-3" />}><X aria-hidden="true" /></DialogPrimitive.Close>; }
export { Dialog, DialogTrigger, DialogClose, DialogContent, DialogTitle, DialogDescription, DialogCloseButton };
