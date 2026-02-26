import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.genzzone.com';

// Function to get CSRF token from cookies
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const name = 'csrftoken';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift()?.trim() || null;
  return null;
}

/** Call before POST if you got 403 CSRF - fetches /api/csrf/ so the cookie is set, then next request can send the token. */
export async function ensureCsrfCookie(): Promise<void> {
  await fetch(`${API_BASE_URL}/api/csrf/`, { credentials: 'include', method: 'GET' });
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add CSRF token to all requests
api.interceptors.request.use((config) => {
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});

// Log 403/5xx for debugging (e.g. wrong API URL or CSRF)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    if (status === 403 || (status && status >= 500)) {
      console.error('[API error]', status, err.config?.baseURL + err.config?.url, err.response?.data);
    }
    return Promise.reject(err);
  }
);

// Re-export shared types from types/api (single source of truth)
export type {
  CategoryChild,
  Category,
  ProductCategory,
  ProductColor,
  ProductSizeOption,
  Product,
  BestSelling,
  Notification,
  HeroImage,
} from "@/types/api";
import type {
  Product,
  BestSelling,
  Category,
  HeroImage,
  Notification,
} from "@/types/api";

// Helper function to convert relative image URLs to absolute URLs
export function getImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  
  // If already an absolute URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If relative URL, prepend API base URL
  // Remove leading slash if present to avoid double slashes
  const cleanUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${API_BASE_URL}${cleanUrl}`;
}

// API Functions - Read-only product endpoints
export const productApi = {
  getAll: async (search?: string, category?: string): Promise<Product[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (category) params.category = category;
    const response = await api.get('/api/products/', { params });
    return response.data.results || response.data;
  },

  getById: async (id: number): Promise<Product> => {
    const response = await api.get(`/api/products/${id}/`);
    return response.data;
  },
};

// API Functions - Categories
export const categoryApi = {
  getTree: async (): Promise<Category[]> => {
    const response = await api.get('/api/categories/tree/');
    return response.data;
  },
};

// API Functions - Best Selling products
export const bestSellingApi = {
  getAll: async (): Promise<BestSelling[]> => {
    const response = await api.get('/api/best-selling/');
    return response.data.results || response.data;
  },
};

// API Functions - Notifications
export const notificationApi = {
  getActive: async (): Promise<Notification | null> => {
    try {
      const response = await api.get('/api/notifications/active/');
      return response.data.is_active ? response.data : null;
    } catch (error) {
      console.error('Error fetching notification:', error);
      return null;
    }
  },
};

// API Functions - Hero Image
export const heroImageApi = {
  getActive: async (): Promise<HeroImage | null> => {
    try {
      const response = await api.get<HeroImage | null>('/api/hero-image/active/');
      return response.data ?? null;
    } catch (error) {
      console.error('Error fetching hero image:', error);
      return null;
    }
  },
};

// Order types
export interface CreateOrderData {
  customer_name: string;
  district: string;
  address: string;
  phone_number: string;
  product_id: number;
  product_size: string;
  quantity: number;
}

/**
 * One product line item in the place-order payload.
 * Uses product_sizes (label -> selected value) for the new multi-size implementation.
 *
 * Example JSON for one product:
 * {
 *   "product_id": 1,
 *   "product_name": "Combo Shirt + Pants",
 *   "product_sizes": { "Shirt Size": "M", "Pants Size": "30" },
 *   "product_color": "Navy",
 *   "product_image": "https://...",
 *   "quantity": 1,
 *   "unit_price": 1299.00,
 *   "product_total": 1299.00
 * }
 */
export interface CreateOrderProductItem {
  product_id: number;
  product_name: string;
  /** Selected size values by option label. Primary field for sizes (replaces product_size). */
  product_sizes: Record<string, string>;
  product_color: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  product_total: number;
}

/**
 * Full payload sent when user clicks "Place Order".
 *
 * Example top-level JSON:
 * {
 *   "customer_name": "...",
 *   "district": "Dhaka" | "Outside Dhaka",
 *   "address": "...",
 *   "phone_number": "01XXXXXXXXX",
 *   "products": [ CreateOrderProductItem, ... ],
 *   "product_total": 2598.00,
 *   "delivery_charge": 80,
 *   "total_price": 2678.00
 * }
 */
export interface CreateMultiProductOrderData {
  customer_name: string;
  district: string;
  address: string;
  phone_number: string;
  products: CreateOrderProductItem[];
  product_total: number;
  delivery_charge: number;
  total_price: number;
}

export interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  total_amount: string;
  status: string;
  created_at: string;
}

// Cart types
export interface CartItem {
  id: number;
  product: Product;
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

export interface AddToCartData {
  product_id: number;
  quantity?: number;
}

export interface UpdateCartItemData {
  quantity: number;
}

// API Functions - Cart
export const cartApi = {
  get: async (): Promise<Cart> => {
    const response = await api.get('/api/cart/');
    return response.data;
  },

  add: async (data: AddToCartData): Promise<Cart> => {
    const response = await api.post('/api/cart/add/', data);
    return response.data;
  },

  updateItem: async (itemId: number, data: UpdateCartItemData): Promise<Cart> => {
    const response = await api.put(`/api/cart/items/${itemId}/`, data);
    return response.data;
  },

  removeItem: async (itemId: number): Promise<Cart> => {
    const response = await api.delete(`/api/cart/items/${itemId}/remove/`);
    return response.data;
  },

  clear: async (): Promise<void> => {
    await api.delete('/api/cart/');
  },
};

// API Functions - Orders
export const orderApi = {
  create: async (data: CreateOrderData): Promise<Order> => {
    const response = await api.post('/api/orders/create/', data);
    return response.data;
  },

  createMultiProduct: async (data: CreateMultiProductOrderData): Promise<Order> => {
    const response = await api.post('/api/orders/create/', data);
    return response.data;
  },
};

