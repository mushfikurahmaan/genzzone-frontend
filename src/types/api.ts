/** Shared API types (used by both client api.ts and server api-server.ts) */

export interface CategoryChild {
  id: number;
  name: string;
  slug: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  children: CategoryChild[];
}

export interface ProductCategory {
  slug: string;
  name: string;
  parent_name: string | null;
}

export interface ProductColor {
  id: number;
  name: string;
  image: string;
  order: number;
  is_active: boolean;
}

export interface ProductSizeOption {
  label: string;
  options: string[];
}

export interface Product {
  id: number;
  name: string;
  description: string;
  category: ProductCategory;
  category_slug: string;
  regular_price: string;
  offer_price: string | null;
  current_price: string;
  has_offer: boolean;
  image: string | null;
  image2: string | null;
  image3: string | null;
  image4: string | null;
  stock: number;
  is_active: boolean;
  colors: ProductColor[];
  size_options: ProductSizeOption[];
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

export interface HeroImage {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrackingCodeItem {
  pixel_id: string;
}
