import { Button } from '@/components/base/buttons/button';
import { X } from '@untitledui/icons';
import type { ReactNode } from 'react';

interface SidebarCardProps {
  title: string;
  supportingText?: string;
  icon?: ReactNode;
  description?: string;
  children?: ReactNode;
  onClose?: () => void;
}

export const SidebarCard = ({
  title,
  supportingText,
  icon,
  description,
  children,
  onClose,
}: SidebarCardProps) => (
  <div className="bg-primary ring-secondary relative flex flex-col gap-4 rounded-xl p-4 ring-1 ring-inset">
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          {icon}
          <span className="text-primary text-sm font-semibold">{title}</span>
        </div>

        <div className="flex items-center gap-1">
          {!!supportingText && <span className="text-quaternary text-sm">{supportingText}</span>}
          {!!onClose && (
            <Button
              color="tertiary"
              size="xs"
              iconLeading={<X data-icon />}
              aria-label="Close card"
              onClick={onClose}
              className="absolute top-1 right-1"
            />
          )}
        </div>
      </div>

      <span className="text-quaternary text-sm">{description}</span>

      {children}
    </div>
  </div>
);
