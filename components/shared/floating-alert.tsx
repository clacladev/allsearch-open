import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/libs/utils/cn';
import { Info, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

const TONE_ICON_CLASS: Record<'warning' | 'neutral', string> = {
  warning: 'text-amber-600 dark:text-amber-500',
  neutral: 'text-muted-foreground',
};

export function FloatingAlert({
  tone,
  title,
  description,
  confirmLabel,
  onConfirm,
  dismissLabel,
  onClose,
}: {
  tone: 'warning' | 'neutral';
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
  dismissLabel?: string;
  onClose?: () => void;
}) {
  const Icon = tone === 'warning' ? TriangleAlert : Info;

  return (
    <Alert className="flex flex-col gap-3 rounded-xl shadow-xs md:flex-row md:items-center md:justify-between">
      <Icon aria-hidden="true" className={cn(TONE_ICON_CLASS[tone])} />

      <div className="flex-1">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </div>

      {(confirmLabel || dismissLabel) && (
        <AlertAction className="static flex gap-2">
          {onClose && dismissLabel && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              {dismissLabel}
            </Button>
          )}
          {onConfirm && confirmLabel && (
            <Button size="sm" variant="outline" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          )}
        </AlertAction>
      )}
    </Alert>
  );
}
