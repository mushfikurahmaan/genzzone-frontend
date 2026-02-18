/**
 * Meta (Facebook) Pixel helpers. Fire standard events only when the corresponding
 * action actually happens (e.g. Purchase only after a completed order).
 * The base pixel is injected via TrackingScripts from the backend; this module
 * ensures Purchase is sent exactly once per completed order from the frontend.
 */

declare global {
  interface Window {
    fbq?: (
      action: string,
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
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
 * Fires Meta Pixel "Purchase" event. Call this only when the user has completed
 * a real purchase (order created successfully). Safe to call if the pixel
 * script is not loaded (no-op).
 */
export function trackPurchase(params: PurchaseParams): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  try {
    window.fbq('track', 'Purchase', {
      value: params.value,
      currency: params.currency,
      order_id: String(params.order_id),
      content_ids: params.content_ids,
      content_type: params.content_type ?? 'product',
      num_items: params.num_items,
    });
  } catch {
    // Avoid breaking the app if the pixel throws
  }
}
