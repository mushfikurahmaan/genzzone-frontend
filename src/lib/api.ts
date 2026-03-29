import axios, { AxiosError } from "axios";
import type {
  StorefrontProductList,
  StorefrontProductDetail,
  StorefrontCategory,
  PaginatedProducts,
  StorefrontBanner,
  StorefrontNotification,
  UnifiedSearchResponse,
  ShippingZone,
  ShippingOption,
  PricingBreakdownResponse,
  CreateStorefrontOrderBody,
  OrderReceipt,
  StorePublic,
} from "@/types/akkho";
import { normalizeStorefrontList } from "@/lib/storefrontResponse";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_AKKHO_PUBLISHABLE_KEY || "";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${PUBLISHABLE_KEY}`,
  },
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    const status = err.response?.status;
    if (status === 403 || (status && status >= 500)) {
      console.error(
        "[API error]",
        status,
        err.config?.baseURL + (err.config?.url ?? ""),
        err.response?.data
      );
    }
    return Promise.reject(err);
  }
);

export type {
  StorefrontProductList as Product,
  StorefrontProductDetail as ProductDetail,
  StorefrontCategory as Category,
  StorefrontBanner as Banner,
  StorefrontNotification as Notification,
  OrderReceipt,
  CreateStorefrontOrderBody,
  OrderLineInput,
} from "@/types/akkho";

export function getImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  const clean = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${API_BASE_URL}${clean}`;
}

export const productApi = {
  getPage: async (params?: {
    page?: number;
    search?: string;
    category?: string;
    ordering?: string;
  }): Promise<PaginatedProducts> => {
    const response = await api.get<PaginatedProducts>("/products/", {
      params: {
        page: params?.page,
        search: params?.search,
        category: params?.category,
        ordering: params?.ordering,
      },
    });
    return response.data;
  },

  getAll: async (
    search?: string,
    category?: string
  ): Promise<StorefrontProductList[]> => {
    const data = await productApi.getPage({
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
    const response = await api.get<StorefrontProductDetail>(
      `/products/${enc}/`
    );
    return response.data;
  },
};

export const storeApi = {
  getPublic: async (): Promise<StorePublic> => {
    const response = await api.get<StorePublic>("/store/public/");
    return response.data;
  },
};

export const categoryApi = {
  getTree: async (): Promise<StorefrontCategory[]> => {
    const response = await api.get("/categories/", { params: { tree: 1 } });
    return normalizeStorefrontList<StorefrontCategory>(response.data);
  },
};

export const searchApi = {
  unified: async (q: string): Promise<UnifiedSearchResponse> => {
    const response = await api.get<UnifiedSearchResponse>("/search/", {
      params: { q },
    });
    return response.data;
  },

  trendingProducts: async (): Promise<StorefrontProductList[]> => {
    const res = await api.get<UnifiedSearchResponse>("/search/", {
      params: { trending: 1 },
    });
    return res.data.products ?? [];
  },
};

export const notificationApi = {
  getActive: async (): Promise<StorefrontNotification[]> => {
    try {
      const response = await api.get("/notifications/active/");
      return normalizeStorefrontList<StorefrontNotification>(response.data);
    } catch {
      return [];
    }
  },
};

export const shippingApi = {
  getZones: async (): Promise<ShippingZone[]> => {
    const response = await api.get<ShippingZone[]>("/shipping/zones/");
    return response.data;
  },

  getOptions: async (
    zonePublicId: string,
    orderTotal?: string
  ): Promise<ShippingOption[]> => {
    const response = await api.get<ShippingOption[]>("/shipping/options/", {
      params: {
        zone_public_id: zonePublicId,
        ...(orderTotal != null ? { order_total: orderTotal } : {}),
      },
    });
    return response.data;
  },
};

export const pricingApi = {
  breakdown: async (body: {
    items: {
      product_public_id: string;
      quantity: number;
      variant_public_id?: string;
    }[];
    shipping_zone_public_id?: string;
    shipping_method_public_id?: string;
  }): Promise<PricingBreakdownResponse> => {
    const response = await api.post<PricingBreakdownResponse>(
      "/pricing/breakdown/",
      body
    );
    return response.data;
  },
};

export const orderApi = {
  initiateCheckout: async (): Promise<void> => {
    await api.post("/orders/initiate-checkout/", {});
  },

  create: async (data: CreateStorefrontOrderBody): Promise<OrderReceipt> => {
    const response = await api.post<OrderReceipt>("/orders/", data);
    return response.data;
  },
};

/** Stub cart types — server cart not available on Akkho storefront */
export interface CartItem {
  id: number;
  product: StorefrontProductList;
  product_id: number;
  quantity: number;
  subtotal: string;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: number;
  session_key: string;
  items: CartItem[];
  total: string;
  item_count: number;
  created_at: string;
  updated_at: string;
}
