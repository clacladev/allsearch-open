import { SVGProps } from 'react';
import { cx } from '@/utils/cx';

export const TextBackground = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1024"
    height="480"
    viewBox="0 0 1024 480"
    fill="none"
    {...props}
    className={cx('text-bg-tertiary', props.className)}
  >
    <text
      x="50%"
      y="50%"
      dominantBaseline="middle"
      textAnchor="middle"
      fontSize="450"
      fontWeight="bold"
      fill="currentColor"
      style={{ fontFamily: 'var(--font-inter), sans-serif' }}
    >
      {props.children}
    </text>
  </svg>
);
