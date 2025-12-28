import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Product {
  id: number;
  name: string;
  description: string;
  category: 'men' | 'men_shirt' | 'men_panjabi' | 'womens' | 'combo';
  regular_price: string;
  offer_price: string | null;
  current_price: string;
  has_offer: boolean;
  image: string | null;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BestSelling {
  id: number;
  product: Product;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  message: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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

export interface CreateOrderProductItem {
  product_id: number;
  product_name: string;
  product_size: string;
  quantity: number;
  unit_price: number;
  product_total: number;
}

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

