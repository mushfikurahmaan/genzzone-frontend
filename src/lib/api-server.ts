/**
 * Server-only Akkho Storefront API (native fetch).
 */

import type {
  StorefrontProductList,
  StorefrontProductDetail,
  StorefrontCategory,
  PaginatedProducts,
  StorefrontBanner,
  StorefrontNotification,
  UnifiedSearchResponse,
  StorePublic,
} from "@/types/akkho";
import { normalizeStorefrontList } from "@/lib/storefrontResponse";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_PAPERBASE_PUBLISHABLE_KEY || "";

function storefrontUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}/api/v1${p}`;
}

type ServerFetchInit = RequestInit & {
  /**
   * Next.js Data Cache TTL (seconds). Default 60 for catalog/search.
   * Use 0 for CMS-driven content (banners, notifications) so dashboard edits show on the next request.
   */
  revalidate?: number;
};

async function serverFetch<T>(
  path: string,
  options?: ServerFetchInit
): Promise<T> {
  const { revalidate = 60, headers: userHeaders, ...rest } = options ?? {};
  const res = await fetch(storefrontUrl(path), {
    ...rest,
    headers: {
      Authorization: `Bearer ${PUBLISHABLE_KEY}`,
      "Content-Type": "application/json",
      ...userHeaders,
    },
    next: { revalidate },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export const serverStoreApi = {
  /** Branding, contact, policies — `GET /api/v1/store/public/` */
  getPublic: async (): Promise<StorePublic> => {
    return serverFetch<StorePublic>("/store/public/", { revalidate: 0 });
  },
};

/** Absolute image URL for server-rendered images */
export function getServerImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))
    return imageUrl;
  const clean = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${API_BASE_URL}${clean}`;
}

export const serverProductApi = {
  getPage: async (params?: {
    page?: number;
    search?: string;
    category?: string;
    ordering?: string;
  }): Promise<PaginatedProducts> => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.search) sp.set("search", params.search);
    if (params?.category) sp.set("category", params.category);
    if (params?.ordering) sp.set("ordering", params.ordering);
    const q = sp.toString();
    return serverFetch<PaginatedProducts>(`/products/${q ? `?${q}` : ""}`);
  },

  getAll: async (
    search?: string,
    category?: string
  ): Promise<StorefrontProductList[]> => {
    const data = await serverProductApi.getPage({
      page: 1,
      search,
      category,
    });
    return data.results;
  },

  getByIdentifier: async (
    identifier: string
  ): Promise<StorefrontProductDetail> => {
    const enc = encodeURIComponent(identifier);
    return serverFetch<StorefrontProductDetail>(`/products/${enc}/`);
  },
};

export const serverCategoryApi = {
  getTree: async (): Promise<StorefrontCategory[]> => {
    const data = await serverFetch<unknown>("/categories/?tree=1");
    return normalizeStorefrontList<StorefrontCategory>(data);
  },
};

export const serverSearchApi = {
  trendingProducts: async (): Promise<StorefrontProductList[]> => {
    const data = await serverFetch<UnifiedSearchResponse>(
      "/search/?trending=1"
    );
    return data.products ?? [];
  },
};

export const serverBannerApi = {
  getAll: async (): Promise<StorefrontBanner[]> => {
    const data = await serverFetch<unknown>("/banners/", { revalidate: 0 });
    return normalizeStorefrontList<StorefrontBanner>(data);
  },

  /** First ordered banner with an image, else first banner (for text-only hero). */
  getHeroBanner: async (): Promise<StorefrontBanner | null> => {
    try {
      const list = await serverBannerApi.getAll();
      if (!list.length) return null;
      const sorted = [...list].sort((a, b) => a.order - b.order);
      const withImage = sorted.find((b) => b.image_url?.trim());
      return withImage ?? sorted[0] ?? null;
    } catch {
      return null;
    }
  },
};

export const serverNotificationApi = {
  getActive: async (): Promise<StorefrontNotification[]> => {
    try {
      const data = await serverFetch<unknown>("/notifications/active/", {
        revalidate: 0,
      });
      return normalizeStorefrontList<StorefrontNotification>(data);
    } catch {
      return [];
    }
  },
};
