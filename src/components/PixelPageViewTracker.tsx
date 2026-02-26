"use client";

/**
 * Fires Meta Pixel PageView on every page including initial load and SPA navigation.
 * MetaPixel only initializes the pixel; this component owns all PageView firing.
 * Uses lastFiredPathname ref to prevent Strict Mode double-fire for the same path.
 */
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (action: string, eventName: string, params?: Record<string, unknown>, options?: { eventID?: string }) => void;
  }
}

export function PixelPageViewTracker() {
  const pathname = usePathname();
  const lastFiredPathname = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/order/success")) return;
    if (lastFiredPathname.current === pathname) return;
    lastFiredPathname.current = pathname;
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "PageView");
    }
  }, [pathname]);

  return null;
}
