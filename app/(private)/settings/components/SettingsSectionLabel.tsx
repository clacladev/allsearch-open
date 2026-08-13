import type { ReactNode } from 'react';

export default function SettingsSectionLabel({
  title,
  description,
  isRequired,
}: {
  title: ReactNode;
  description?: ReactNode;
  isRequired?: boolean;
}) {
  return (
    <div>
      <h3 className="text-secondary flex items-center gap-0.5 text-sm font-semibold">
        {title}
        {isRequired && <span className="text-brand-tertiary">*</span>}
      </h3>
      {description && <p className="text-tertiary text-sm">{description}</p>}
    </div>
  );
}
