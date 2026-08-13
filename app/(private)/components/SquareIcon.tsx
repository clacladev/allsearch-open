import { cn } from '@/libs/utils/cn';
import Image, { ImageProps } from 'next/image';

type SquareIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export const SquareIcon = ({
  src,
  alt,
  size = 'md',
  ...rest
}: ImageProps & { size?: SquareIconSize }) => {
  const width =
    size === 'xs'
      ? 16
      : size === 'sm'
        ? 24
        : size === 'md'
          ? 32
          : size === 'lg'
            ? 48
            : size === 'xl'
              ? 64
              : size === '2xl'
                ? 128
                : 32;

  return (
    <Image
      src={src}
      alt={alt}
      {...rest}
      width={width}
      height={width}
      className={cn('aspect-square rounded', rest.className)}
    />
  );
};
