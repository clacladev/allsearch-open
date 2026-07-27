import { type HTMLAttributes } from 'react';
import { cx } from '@/utils/cx';
import { config } from '@/config';
import Image, { ImageProps } from 'next/image';

export const AppLogo = (props: HTMLAttributes<HTMLOrSVGElement>) => {
  return (
    <div
      {...props}
      className={cx('flex h-8 w-max items-center justify-start overflow-visible', props.className)}
    >
      {/* Minimal logo */}
      <AppLogoMinimal />
      {/* Gap that adjusts to the height of the container */}
      <div className="aspect-[0.3] h-full" />
      {/* Logomark */}
      <div className="text-xl font-bold">{config.appName}</div>
    </div>
  );
};

export const AppLogoMinimal = ({ className, ...rest }: Omit<ImageProps, 'src' | 'alt'>) => (
  <Image
    src="/logo.svg"
    alt="AllSearch Logo"
    className={cx('aspect-square h-full w-auto shrink-0', className)}
    width={38}
    height={38}
    {...rest}
  />
);
