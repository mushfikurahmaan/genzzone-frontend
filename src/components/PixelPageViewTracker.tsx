"use client";

/**
 * Fires Meta Pixel PageView on SPA navigation.
 * Next.js uses client-side routing, so we must track PageView on each route change.
 * Skips initial mount (base pixel already fires PageView) to avoid duplicates.
 */
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (action: string, eventName: string) => void;
  }
}

export function PixelPageViewTracker() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (pathname?.startsWith("/order/success")) return;
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "PageView");
    }
  }, [pathname]);

  return null;
}
