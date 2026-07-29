import { useState, useEffect, useCallback } from 'react';

export const SM_BREAKPOINT = 640;
export const MD_BREAKPOINT = 768;
export const LG_BREAKPOINT = 1024;
export const XL_BREAKPOINT = 1280;
export const XXL_BREAKPOINT = 1536;

export const MOBILE_BREAKPOINT = MD_BREAKPOINT;
export const TABLET_BREAKPOINT = LG_BREAKPOINT;
export const DESKTOP_BREAKPOINT = XL_BREAKPOINT;

export function useIsViewportSmallerThan(breakpoint: number = MOBILE_BREAKPOINT): boolean {
  const [value, setValue] = useState(false);

  const checkValue = useCallback(() => setValue(window.innerWidth < breakpoint), [breakpoint]);

  useEffect(() => {
    checkValue();
    window.addEventListener('resize', checkValue);
    return () => window.removeEventListener('resize', checkValue);
  }, [checkValue, breakpoint]);

  return value;
}

export const useIsMobile = () => useIsViewportSmallerThan(MOBILE_BREAKPOINT);
export const useIsTabletOrSmaller = () => useIsViewportSmallerThan(TABLET_BREAKPOINT);
