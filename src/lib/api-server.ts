/**
 * Server-only API helpers using native fetch.
 * Use in Server Components for data fetching (smaller bundle, better caching).
 */

import type {
  BestSelling,
  Category,
  HeroImage,
  Notification,
  Product,
  TrackingCodeItem,
} from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.genzzone.com";

async function serverFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

/** Absolute image URL for server-rendered images */
export function getServerImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))
    return imageUrl;
  const clean = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${API_BASE_URL}${clean}`;
}

export const serverProductApi = {
  getAll: async (search?: string, category?: string): Promise<Product[]> => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    const q = params.toString();
    const data = await serverFetch<{ results?: Product[] }>(
      `/api/products/${q ? `?${q}` : ""}`
    );
    return data.results ?? (data as unknown as Product[]);
  },
  getById: async (id: number): Promise<Product> => {
    return serverFetch(`/api/products/${id}/`);
  },
};

export const serverBestSellingApi = {
  getAll: async (): Promise<BestSelling[]> => {
    const data = await serverFetch<{ results?: BestSelling[] }>(
      "/api/best-selling/"
    );
    return data.results ?? (data as unknown as BestSelling[]);
  },
};

export const serverCategoryApi = {
  getTree: async (): Promise<Category[]> => {
    return serverFetch("/api/categories/tree/");
  },
};

export const serverHeroImageApi = {
  getActive: async (): Promise<HeroImage | null> => {
    try {
      const data = await serverFetch<{ is_active?: boolean } & HeroImage>(
        "/api/hero-image/active/"
      );
      return data?.is_active ? data : null;
    } catch {
      return null;
    }
  },
};

export const serverNotificationApi = {
  getActive: async (): Promise<Notification | null> => {
    try {
      const data = await serverFetch<{ is_active?: boolean } & Notification>(
        "/api/notifications/active/"
      );
      return data?.is_active ? data : null;
    } catch {
      return null;
    }
  },
};

export const serverTrackingApi = {
  getActive: async (): Promise<TrackingCodeItem[]> => {
    try {
      return await serverFetch<TrackingCodeItem[]>("/api/tracking-codes/", {
        next: { revalidate: 300 },
      });
    } catch {
      return [];
    }
  },
};
