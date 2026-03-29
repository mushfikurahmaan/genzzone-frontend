/**
 * Normalize list payloads from Akkho/DRF (array, paginated `results`, or nested keys).
 */
export function normalizeStorefrontList<T>(data: unknown): T[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data as T[];
  if (typeof data === "object") {
    const o = data as Record<string, unknown>;
    for (const key of [
      "results",
      "data",
      "banners",
      "notifications",
      "items",
    ] as const) {
      const v = o[key];
      if (Array.isArray(v)) return v as T[];
    }
  }
  return [];
}
