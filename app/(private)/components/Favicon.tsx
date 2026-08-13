'use client';

import { cn } from '@/libs/utils/cn';
import { getBrandColor } from '@/libs/utils/brandColor';
import { useState } from 'react';

export function Favicon({
  url,
  alt,
  brandId,
  color,
  className,
}: {
  url?: string;
  alt?: string;
  /**
   * When provided, a unique brand color derived from the id is used as the
   * fallback background (instead of the generic placeholder SVG).
   */
  brandId?: string;
  /**
   * Overrides the derived brand color. Useful for the project's own brand
   * which should always show the brand green.
   */
  color?: string;
  className?: string;
}) {
  const [isFailed, setIsFailed] = useState(false);
  const showFallback = !url || isFailed;

  const brandColor = color ?? (brandId ? getBrandColor(brandId) : undefined);
  const initials = alt?.slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        'bg-primary outline-tertiary flex size-10 items-center justify-center overflow-hidden rounded-lg outline-1 dark:bg-neutral-100',
        className
      )}
      style={showFallback && brandColor ? { backgroundColor: brandColor } : undefined}
    >
      {showFallback ? (
        brandColor && initials ? (
          <span className="text-xs font-semibold text-white">{initials}</span>
        ) : (
          <img
            src="/shared/favicon-placeholder.svg"
            alt={alt}
            className="h-full w-full object-cover"
          />
        )
      ) : (
        <img
          src={url}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setIsFailed(true)}
        />
      )}
    </div>
  );
}
