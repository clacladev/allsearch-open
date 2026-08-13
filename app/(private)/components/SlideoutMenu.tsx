'use client';

import { PanelTop } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetCloseButton } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export interface SlideoutMenuProps { isOpen: boolean; setIsOpen: (isOpen: boolean) => void; }
export const SlideoutMenu = ({ isOpen, setIsOpen, title, description, icon, isLoading, action, actionTitle, closeTitle, content, footerAction, footerActionLabel, footerActionLoading, initialFocus, finalFocus }: SlideoutMenuProps & { title: string; description: string; icon?: React.ReactNode; isLoading?: boolean; action?: () => void; actionTitle?: string; closeTitle?: string; content: React.ReactNode; footerAction?: () => void; footerActionLabel?: string; footerActionLoading?: boolean; initialFocus?: React.RefObject<HTMLElement | null>; finalFocus?: React.RefObject<HTMLElement | null>; }) => (
  <Sheet open={isOpen} onOpenChange={setIsOpen}>
    <SheetContent side="right" initialFocus={initialFocus} finalFocus={finalFocus} className="p-0">
      <div className="relative flex items-start gap-4 px-6 pt-6"><div className="flex size-10 items-center justify-center rounded-full bg-muted">{icon ?? <PanelTop aria-hidden="true" />}</div><div className="flex flex-col gap-0.5 pr-10"><SheetTitle>{title}</SheetTitle><SheetDescription>{description}</SheetDescription></div><SheetCloseButton label={`Close ${title}`} /></div>
      <div className="flex-1 px-6 py-4">{content}</div>
      <div className="border-border flex justify-end gap-3 border-t p-4"><Button variant="secondary" onClick={footerAction && footerActionLabel ? footerAction : () => setIsOpen(false)} disabled={footerActionLoading}>{footerActionLoading ? <Spinner /> : footerActionLabel ?? closeTitle ?? 'Cancel'}</Button>{actionTitle && <Button onClick={action} disabled={isLoading}>{isLoading ? <Spinner /> : actionTitle}</Button>}</div>
    </SheetContent>
  </Sheet>
);
