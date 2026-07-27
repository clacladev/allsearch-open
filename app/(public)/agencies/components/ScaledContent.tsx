'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Cross-browser alternative to `style={{ zoom: scale }}`.
 * Uses transform: scale() which works everywhere, combined with a ResizeObserver
 * to collapse the extra layout space that transform leaves behind.
 */
export function ScaledContent({
  scale,
  className,
  children,
}: {
  scale: number;
  className?: string;
  children: React.ReactNode;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setHeight(entry.contentRect.height * scale);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [scale]);

  return (
    <div className={className} style={{ overflow: 'hidden', height }}>
      <div
        ref={innerRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${100 / scale}%`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
