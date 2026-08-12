'use client';

import { useRef } from 'react';
import { AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
type Variant = 'delete' | 'archive' | 'confirm';
export interface ModalProps { isOpen: boolean; setIsOpen: (isOpen: boolean) => void; }
export function ConfirmModal({ isOpen, setIsOpen, variant, title, description, isLoading, action, actionLabel }: ModalProps & { variant: Variant; title: string; description: string; isLoading: boolean; action: () => void; actionLabel?: string; }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const icon = variant === 'confirm' ? <CheckCircle2 className="text-emerald-600" aria-hidden="true" /> : variant === 'archive' ? <AlertTriangle className="text-destructive" aria-hidden="true" /> : <Trash2 className="text-destructive" aria-hidden="true" />;
  const label = actionLabel ?? (variant === 'delete' ? 'Delete' : variant === 'archive' ? 'Archive' : 'Confirm');
  return <AlertDialog open={isOpen} onOpenChange={setIsOpen}><AlertDialogContent initialFocus={cancelRef}><div className="flex items-center gap-3">{icon}<div><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></div></div><div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><AlertDialogCancel render={<Button ref={cancelRef} variant="secondary" disabled={isLoading}>Cancel</Button>} /><AlertDialogAction render={<Button variant={variant === 'confirm' ? 'default' : 'destructive'} disabled={isLoading} onClick={action}>{isLoading ? <Spinner /> : label}</Button>} /></div></AlertDialogContent></AlertDialog>;
}
