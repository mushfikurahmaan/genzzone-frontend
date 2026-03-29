/**
 * App-facing type aliases for storefront data.
 * Prefer importing from @/types/akkho for precise API shapes.
 */
export type {
  StorefrontProductList as Product,
  StorefrontProductDetail as ProductDetail,
  StorefrontProductVariant as ProductVariant,
  StorefrontCategory as Category,
  StorefrontBanner as Banner,
  StorefrontNotification as Notification,
  OrderReceipt,
  OrderReceiptItem,
  PaginatedProducts,
  StorePublic,
  ShippingZone,
  ShippingOption,
  PricingBreakdownResponse,
  CreateStorefrontOrderBody,
  OrderLineInput,
  VariantMatrix,
  VariantMatrixAttribute,
  ProductImage,
  StockStatus,
} from "./akkho";
