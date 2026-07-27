import { Button, Props } from '@/components/base/buttons/button';
import { cx } from '@/utils/cx';

export const BG_GRADIENT_CLASS =
  'linear-gradient(45deg, #ff9a9e, #fad0c4, #fad0c4, #a18cd1, #fbc2eb)';

const CORE_CLASS = 'from-[#ff9a9e] to-[#a18cd1] bg-linear-to-r bg-clip-text text-transparent';

type GradientTextProps = {
  children: React.ReactNode;
  className?: string;
};

export const GradientTextH1 = ({ children, className }: GradientTextProps) => (
  <h1 className={cx(CORE_CLASS, 'text-xl font-semibold', className)}>{children}</h1>
);

export const GradientTextParagraph = ({ children, className }: GradientTextProps) => (
  <p className={cx(CORE_CLASS, 'text-base', className)}>{children}</p>
);

export const GradientTextSpan = ({ children, className }: GradientTextProps) => (
  <span className={cx(CORE_CLASS, className)}>{children}</span>
);

export const GradientButton = (props: Props) => (
  <Button
    {...props}
    className={cx(
      'animate-shimmer shadow-primary/80 bg-linear-to-r from-[#ff9a9e] to-[#a18cd1] shadow-2xl',
      props.className
    )}
  >
    {props.children}
  </Button>
);
