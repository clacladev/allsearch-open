'use client';

import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog';
import { cn } from '@/libs/utils/cn';

const AlertDialog = (props: AlertDialogPrimitive.Root.Props) => <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
const AlertDialogTrigger = (props: AlertDialogPrimitive.Trigger.Props) => <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
const AlertDialogAction = (props: AlertDialogPrimitive.Close.Props) => <AlertDialogPrimitive.Close data-slot="alert-dialog-action" {...props} />;
const AlertDialogCancel = (props: AlertDialogPrimitive.Close.Props) => <AlertDialogPrimitive.Close data-slot="alert-dialog-cancel" {...props} />;
function AlertDialogContent({ className, children, ...props }: AlertDialogPrimitive.Popup.Props) { return <AlertDialogPrimitive.Portal><AlertDialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" /><AlertDialogPrimitive.Popup data-slot="alert-dialog-content" className={cn('fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg bg-popover p-6 text-popover-foreground shadow-lg outline-hidden', className)} {...props}>{children}</AlertDialogPrimitive.Popup></AlertDialogPrimitive.Portal>; }
const AlertDialogTitle = (props: AlertDialogPrimitive.Title.Props) => <AlertDialogPrimitive.Title data-slot="alert-dialog-title" className="text-lg font-semibold" {...props} />;
const AlertDialogDescription = ({ className, ...props }: AlertDialogPrimitive.Description.Props) => <AlertDialogPrimitive.Description data-slot="alert-dialog-description" className={cn('text-sm text-muted-foreground whitespace-pre-line', className)} {...props} />;
export { AlertDialog, AlertDialogTrigger, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogTitle, AlertDialogDescription };
