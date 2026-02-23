/**
 * Meta (Facebook) Pixel helpers. Fire standard events only when the corresponding
 * action actually happens (e.g. Purchase only after a completed order).
 * The base pixel is initialised via TrackingScripts from the backend; this module
 * ensures Purchase is sent exactly once per completed order from the frontend.
 */

declare global {
  interface Window {
    fbq?: (
      action: string,
      eventName: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string }
    ) => void;
    _fbq?: unknown;
  }
}

export interface PurchaseParams {
  value: number;
  currency: string;
  order_id: string | number;
  content_ids?: (string | number)[];
  content_type?: string;
  num_items?: number;
}

/**
 * Fires Meta Pixel "Purchase" event exactly once per completed order.
 * Generates a unique eventID for each call so the event can be deduplicated
 * against a server-side Conversions API if one is added in the future.
 *
 * Returns the eventID that was used, so it can be forwarded to the backend.
 * Returns null if the pixel is not loaded (no-op).
 */
export function trackPurchase(params: PurchaseParams): string | null {
  if (typeof window === 'undefined' || !window.fbq) return null;
  try {
    const eventID = crypto.randomUUID();
    window.fbq('track', 'Purchase', {
      value: params.value,
      currency: params.currency,
      order_id: String(params.order_id),
      content_ids: params.content_ids,
      content_type: params.content_type ?? 'product',
      num_items: params.num_items,
    }, { eventID });
    return eventID;
  } catch {
    // Avoid breaking the app if the pixel throws
    return null;
  }
}
