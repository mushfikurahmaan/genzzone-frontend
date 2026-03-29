/** Akkho Storefront API shapes — see docs/AKKHO_STOREFRONT_API.md */

export type StockStatus = "out_of_stock" | "low" | "in_stock";

export interface StorefrontProductList {
  public_id: string;
  name: string;
  brand: string;
  sku: string;
  price: string;
  original_price: string | null;
  image_url: string | null;
  category_public_id: string;
  category_slug: string;
  category_name: string;
  slug: string;
  stock_status: StockStatus;
  available_quantity: number;
  variant_count: number;
  extra_data: Record<string, unknown>;
}

export interface ProductImage {
  public_id: string;
  image_url: string;
  alt: string;
  order: number;
}

export interface VariantOption {
  attribute_public_id: string;
  attribute_slug: string;
  attribute_name: string;
  value_public_id: string;
  value: string;
}

export interface StorefrontProductVariant {
  public_id: string;
  sku: string;
  available_quantity: number;
  stock_status: StockStatus;
  price: string;
  options: VariantOption[];
}

export interface VariantMatrixAttribute {
  slug: string;
  attribute_public_id: string;
  attribute_name: string;
  values: { value_public_id: string; value: string }[];
}

export type VariantMatrix = Record<string, VariantMatrixAttribute>;

export interface StorefrontProductDetail extends StorefrontProductList {
  stock_tracking: boolean;
  description: string;
  images: ProductImage[];
  variants: StorefrontProductVariant[];
  breadcrumbs?: string[];
  related_products?: StorefrontProductList[];
  variant_matrix?: VariantMatrix;
}

export interface StorefrontCategory {
  public_id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  parent_public_id: string | null;
  order: number;
  children?: StorefrontCategory[];
}

export interface PaginatedProducts {
  count: number;
  next: string | null;
  previous: string | null;
  results: StorefrontProductList[];
}

/** `GET /store/public/` — `storefront_public` from dashboard (Settings → Store). */
export interface StorePublicSocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
  tiktok?: string;
  pinterest?: string;
  website?: string;
}

export interface StorePublic {
  store_name: string;
  logo_url: string | null;
  currency: string;
  currency_symbol: string;
  country: string;
  support_email: string;
  phone: string;
  address: string;
  extra_field_schema: unknown[];
  modules_enabled: Record<string, boolean>;
  theme_settings: { primary_color?: string };
  seo: { default_title: string; default_description: string };
  policy_urls: { returns: string; refund: string; privacy: string };
  social_links?: StorePublicSocialLinks | Record<string, string>;
}

export interface StorefrontBanner {
  public_id: string;
  title: string;
  image_url: string | null;
  cta_text: string;
  cta_url: string;
  order: number;
  start_at: string | null;
  end_at: string | null;
}

export interface StorefrontNotification {
  public_id: string;
  cta_text: string;
  notification_type: string;
  cta_url: string | null;
  cta_label: string;
  order: number;
  is_active: boolean;
  is_currently_active: boolean;
  start_at: string | null;
  end_at: string | null;
}

export interface ShippingCostRule {
  min_order_total: number;
  shipping_cost: number;
  max_order_total?: number;
}

export interface ShippingZone {
  zone_public_id: string;
  name: string;
  estimated_days: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  cost_rules: ShippingCostRule[];
}

export interface ShippingOption {
  rate_public_id: string;
  method_public_id: string;
  method_name: string;
  method_type: string;
  method_order: number;
  zone_public_id: string;
  zone_name: string;
  price: string;
  rate_type: string;
  min_order_total?: string;
  max_order_total?: string;
}

export interface PricingBreakdownLine {
  product_public_id: string;
  quantity: number;
  unit_price: string;
  line_subtotal: string;
}

export interface PricingBreakdownResponse {
  base_subtotal: string;
  shipping_cost: string;
  final_total: string;
  lines: PricingBreakdownLine[];
}

export interface OrderLineInput {
  product_public_id: string;
  quantity: number;
  variant_public_id?: string;
}

export interface CreateStorefrontOrderBody {
  shipping_zone_public_id: string;
  shipping_method_public_id?: string;
  shipping_name: string;
  phone: string;
  email?: string;
  shipping_address: string;
  district?: string;
  products: OrderLineInput[];
}

export interface OrderReceiptItem {
  product_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  variant_details: string | null;
}

export interface OrderReceipt {
  public_id: string;
  order_number: string;
  status: string;
  customer_name: string;
  phone: string;
  shipping_address: string;
  items: OrderReceiptItem[];
  subtotal: string;
  shipping_cost: string;
  total: string;
  created_at?: string;
}

export interface UnifiedSearchResponse {
  products: StorefrontProductList[];
  categories: StorefrontCategory[];
  suggestions: string[];
  trending: boolean;
}

export interface CatalogFiltersPayload {
  categories: { public_id: string; name: string; slug: string }[];
  attributes: Record<string, { public_id: string; value: string }[]>;
  brands: string[];
  price_range: { min: number; max: number };
}
