'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackingApi } from '@/lib/api';

declare global {
  interface Window {
    _fbq?: unknown;
  }
}

/**
 * Initialises Meta (Facebook) Pixel and fires PageView on every page navigation.
 *
 * On mount:
 *   1. Fetches the active Pixel ID from the backend.
 *   2. Bootstraps the fbq stub so queued calls are preserved before the SDK loads.
 *   3. Loads fbevents.js from Facebook's CDN.
 *   4. Calls fbq('init', pixelId) and fires the first PageView.
 *   5. Injects the <noscript> fallback image tag.
 *
 * On every SPA navigation (usePathname change):
 *   - Fires fbq('track', 'PageView') once per new URL.
 *   - The initializedRef sentinel prevents double-firing the initial PageView.
 */
export function TrackingScripts() {
  const pathname = usePathname();
  const initializedRef = useRef(false);
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const codes = await trackingApi.getActive();
        if (!mounted) return;

        const pixelIds = codes.map((c) => c.pixel_id).filter(Boolean);
        if (pixelIds.length === 0) return;

        // Bootstrap the fbq stub (mirrors the standard Meta Pixel base code).
        if (!window.fbq) {
          const fbq = function (...args: unknown[]) {
            (fbq as unknown as { callMethod?: (...a: unknown[]) => void }).callMethod
              ? (fbq as unknown as { callMethod: (...a: unknown[]) => void }).callMethod(...args)
              : (fbq as unknown as { queue: unknown[][] }).queue.push(args);
          } as unknown as Window['fbq'] & { loaded?: boolean; version?: string; queue: unknown[][] };
          fbq.queue = [];
          fbq.loaded = true;
          fbq.version = '2.0';
          window.fbq = fbq;
          if (!window._fbq) window._fbq = fbq;
        }

        await loadFbEventsSdk();
        if (!mounted) return;

        for (const id of pixelIds) {
          window.fbq!('init', id);
          injectNoscriptFallback(id);
        }

        window.fbq!('track', 'PageView');

        lastPathRef.current = pathname;
        initializedRef.current = true;
      } catch (err) {
        console.error('Failed to initialise Meta Pixel:', err);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fire PageView on every subsequent SPA navigation.
  useEffect(() => {
    if (!initializedRef.current) return;
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [pathname]);

  return null;
}

function loadFbEventsSdk(): Promise<void> {
  return new Promise((resolve) => {
    if (document.getElementById('fb-pixel-sdk')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'fb-pixel-sdk';
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

function injectNoscriptFallback(pixelId: string) {
  const id = `fb-pixel-noscript-${pixelId}`;
  if (document.getElementById(id)) return;
  const noscript = document.createElement('noscript');
  noscript.id = id;
  const img = document.createElement('img');
  img.height = 1;
  img.width = 1;
  img.style.display = 'none';
  img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
  noscript.appendChild(img);
  document.body.appendChild(noscript);
}
