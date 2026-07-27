import { cx } from '@/utils/cx';

export const TextHighlight = ({ children }: { children: React.ReactNode }) => (
  <span className="text-fg-brand-primary">{children}</span>
);

export const TextBgHighlight = ({
  variant = 'medium',
  children,
}: {
  variant?: 'soft' | 'medium';
  children: React.ReactNode;
}) => (
  <span
    className={cx(variant === 'soft' ? 'bg-brand-solid/10' : 'bg-brand-solid/30', '-mx-0.5 px-1')}
  >
    {children}
  </span>
);

export const MdBreak = () => <br className="hidden md:block" />;
