'use client';

/**
 * PixelPageViewTracker — Client Component.
 *
 * Fires fbq('track', 'PageView') on every SPA navigation after the initial
 * page load. The initial PageView is already fired by the inline script in
 * MetaPixelScripts, so this component skips the first render to avoid
 * double-counting.
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function PixelPageViewTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip the very first run — the inline script already fired PageView.
    if (lastPathRef.current === null) {
      lastPathRef.current = pathname;
      return;
    }
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [pathname]);

  return null;
}
