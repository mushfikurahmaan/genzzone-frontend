# Akkho Storefront API

Reference for **customer-facing storefront clients** (external sites and headless storefront apps). Every endpoint here is intended to be called with a **publishable store API key** (`ak_pk_…`).

This document is derived from `api-akkho/` (views with `IsStorefrontAPIKey` and `allow_api_key = True`). It does **not** cover dashboard, admin, auth, store-owner, or customer-account APIs.

---

## Table of contents

1. [Authentication](#1-authentication)
2. [Endpoints](#2-endpoints)
3. [Data models and JSON shapes](#3-data-models-and-json-shapes)
4. [Behavior rules](#4-behavior-rules)
5. [Edge cases and status codes](#5-edge-cases-and-status-codes)
6. [Frontend integration](#6-frontend-integration)

---

## 1. Authentication

### 1.1 Publishable key

| Item | Detail |
|------|--------|
| Header | `Authorization: Bearer <token>` |
| Token | Must be a **publishable** key: prefix `ak_pk_` (resolved in `engine/core/store_api_key_auth.py`) |
| Store context | Valid key binds `request.store` to that key’s store (tenant) |

### 1.2 Secret keys

Bearer tokens starting with `ak_sk_` are **rejected** for these storefront routes (**403**): *"Secret API keys cannot access storefront endpoints."*

### 1.3 Middleware

When `TENANT_API_KEY_ENFORCE` is true (default in `config/settings/base.py`), non-exempt paths under `/api/v1/` require a valid `ak_pk_` bearer. Invalid/missing key → **401** `{"detail": "Invalid API key."}`; repeated failures may yield **429** with `Retry-After: 60`.

Storefront routes documented here are **not** under the middleware-exempt prefixes (`/api/v1/auth/`, `/api/v1/admin/`, etc.), so the publishable key is required.

### 1.4 What this document excludes

Not documented here (not storefront-key flows): `/api/v1/admin/*`, `/api/v1/stores/*`, `/api/v1/customers/*`, `/api/v1/settings/*`, `/api/v1/auth/*`, `/api/v1/system-notifications/*`, and **`GET /api/v1/orders/`** (order list is dashboard/JWT-only in `OrderCreateView.get_permissions`).

---

## 2. Endpoints

Base URL prefix: **`/api/v1/`**. All methods below require `Authorization: Bearer ak_pk_…` unless stated otherwise.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/store/public/` | Public branding and storefront config (`StorePublicView`, `stores/storefront_views.py`) |
| GET | `/api/v1/products/` | Paginated product list (`ProductListView`, `products/views.py`) |
| GET | `/api/v1/products/search/` | Product search by `q` (`ProductSearchView`) |
| GET | `/api/v1/products/<identifier>/` | Product detail: `prd_…` **or** slug (`ProductDetailView`) |
| GET | `/api/v1/products/<identifier>/related/` | Related products (max 4, not paginated) (`ProductRelatedView`) |
| GET | `/api/v1/categories/` | Categories; optional `parent`, `tree` (`CategoryListView`) |
| GET | `/api/v1/categories/<slug>/` | Single category by slug (`CategoryDetailView`) |
| GET | `/api/v1/catalog/filters/` | Catalog filter metadata (`CatalogFiltersView`) |
| GET | `/api/v1/search/` | Unified search / trending (`StorefrontSearchView`, `core/storefront_search_views.py`) |
| GET | `/api/v1/banners/` | Active banners (`PublicBannerListView`, `banners/views.py`) |
| GET | `/api/v1/notifications/active/` | Active storefront CTAs (`ActiveNotificationListView`, `notifications/views.py`) |
| GET | `/api/v1/shipping/zones/` | Shipping zones + cost rule summary (`ShippingZonesView`, `shipping/views.py`) |
| GET | `/api/v1/shipping/options/` | Options for a zone + order total (`ShippingOptionsView`) |
| POST | `/api/v1/shipping/preview/` | Shipping quote for cart lines + zone (`ShippingPreviewView`) |
| POST | `/api/v1/pricing/preview/` | Single-line pricing + optional shipping (`PricingPreviewView`, `orders/pricing_preview_views.py`) |
| POST | `/api/v1/pricing/breakdown/` | Multi-line cart pricing + optional shipping (`PricingBreakdownView`, `orders/pricing_breakdown_views.py`) |
| POST | `/api/v1/orders/initiate-checkout/` | Checkout funnel signal; **200** `{"status": "ok"}` (`InitiateCheckoutView`, `orders/views.py`) |
| POST | `/api/v1/orders/` | Create order (stateless checkout); **201** + receipt body (`OrderCreateView`, `orders/views.py`) |
| POST | `/api/v1/support/tickets/` | Create support ticket; **201** (`SupportTicketCreateView`, `support/views.py`) |

### 2.1 Query parameters

**`GET /api/v1/products/`** — from `build_product_list_queryset` / `_normalize_list_params` in `products/services.py`:

| Query | Description |
|-------|-------------|
| `page` | Page number (default `1`; page size **24** from `REST_FRAMEWORK` in `config/settings/base.py`) |
| `category` | Comma-separated category **slugs** (includes descendants) |
| `brand` | Comma-separated brand strings |
| `search` | `icontains` on name, description, brand |
| `price_min`, `price_max` | Filter `price` (invalid decimals ignored) |
| `attributes` | Comma-separated variant attribute **value** `public_id`s |
| `ordering` or `sort` | `newest` (default), `price_asc`, `price_desc`, `popularity` |

**`GET /api/v1/categories/`**

| Query | Description |
|-------|-------------|
| `parent` | Parent category **slug**; if omitted, roots only |
| `tree` | `1` / `true` / `yes` → nested tree; each node adds **`children`** (see §3) |

**`GET /api/v1/products/search/`**

| Query | Description |
|-------|-------------|
| `q` | Search string; if length **&lt; 2**, empty queryset |

**`GET /api/v1/search/`**

| Query | Description |
|-------|-------------|
| `q` | If length **&lt; 2** (and not trending), empty product/category/suggestion lists |
| `trending` | `1` / `true` / `yes` → popular products (ignores `q`) |

**`GET /api/v1/shipping/options/`**

| Query | Description |
|-------|-------------|
| `zone_public_id` | **Required**; missing → **400** |
| `order_total` | Optional; used to filter rates by min/max bands |

### 2.2 Request bodies (POST)

**`POST /api/v1/shipping/preview/`** (`ShippingPreviewView`)

| Field | Type | Required |
|-------|------|----------|
| `zone_public_id` | string | yes |
| `items` | non-empty array | yes |
| Each `items[]` | `product_public_id`, `quantity` (int &gt; 0), optional `variant_public_id` | per line |

**`POST /api/v1/pricing/preview/`** (`PricingPreviewInputSerializer`)

| Field | Type | Required |
|-------|------|----------|
| `product_public_id` | string | yes |
| `variant_public_id` | string | no (default `""`) |
| `quantity` | int ≥ 1 | no (default **1**) |
| `shipping_zone_public_id` | string | no (default `""`) |
| `shipping_method_public_id` | string | no (default `""`) |

**`POST /api/v1/pricing/breakdown/`** (`PricingBreakdownView`)

| Field | Type | Required |
|-------|------|----------|
| `items` | non-empty array | yes |
| Each `items[]` | `product_public_id`, `quantity` (int &gt; 0), optional `variant_public_id` | |
| `shipping_zone_public_id` | string | no |
| `shipping_method_public_id` | string | no |

**`POST /api/v1/orders/`** — allowed top-level keys only (`OrderCreateView.create`):  
`shipping_zone_public_id`, `shipping_method_public_id`, `shipping_name`, `phone`, `email`, `shipping_address`, `district`, `products`.  
Unknown keys → **400**.

Body matches **`OrderCreateSerializer`** (`orders/serializers.py`):

| Field | Required | Notes |
|-------|----------|--------|
| `shipping_zone_public_id` | yes | Active zone for store |
| `shipping_method_public_id` | no | Active method for store |
| `shipping_name` | yes | Non-blank after trim |
| `phone` | yes | Normalized to 11 digits, must start with `01` |
| `email` | no | Default `""`; if blank and user authenticated (unusual for pure API key), may fall back to user email in view |
| `shipping_address` | yes | Non-blank |
| `district` | no | Default `""` |
| `products` | yes | Array, min length 1; each object only `product_public_id`, `quantity`, optional `variant_public_id` |

Per line: `product_public_id` must start with `prd_`; `quantity` int, 1–**1000**; variant rules in §4.

**`POST /api/v1/support/tickets/`** — `SupportTicketCreateSerializer` fields:  
`name`, `email`, `phone`, `subject`, `message`, `order_number`, `category`, `priority`, `attachments` (list of files, optional).  
Parsers: multipart, form, JSON (`support/views.py`). Model requires `name`, `email`, `message`; others have model defaults (see `support/models.py`).

---

## 3. Data models and JSON shapes

### 3.1 Conventions

- **Read-only** fields come from serializers (`read_only=True` or no input on `Serializer`).
- **`SerializerMethodField`** return types are described from the corresponding `get_*` in code.
- **Stock status** string: one of `out_of_stock`, `low`, `in_stock` (`products/stock_signals.py`, threshold from store settings, default low threshold **5** if unset).

### 3.2 Product (list) — `StorefrontProductListSerializer`

| Field | Type | Nullable | Read-only | Notes |
|-------|------|----------|-----------|--------|
| `public_id` | string | no | yes | |
| `name` | string | no | yes | |
| `brand` | string | inferred | yes | From model |
| `sku` | string | inferred | yes | |
| `price` | decimal | no | yes | Model field |
| `original_price` | decimal | yes | yes | |
| `image_url` | string / null | yes | yes | Absolute URL |
| `category_public_id` | string | inferred | yes | |
| `category_slug` | string | inferred | yes | |
| `category_name` | string | inferred | yes | |
| `slug` | string | no | yes | |
| `stock_status` | string | no | yes | See conventions |
| `available_quantity` | int | no | yes | Aggregated stock display |
| `variant_count` | int | no | yes | Active variants |
| `extra_data` | JSON | inferred | yes | Model JSON |

### 3.3 Product (detail) — `StorefrontProductDetailSerializer`

All list fields above where overlapping, plus:

| Field | Type | Nullable | Read-only | Notes |
|-------|------|----------|-----------|--------|
| `stock_tracking` | bool | inferred | yes | Model |
| `description` | string | inferred | yes | |
| `images` | array | no | yes | `ProductImageSerializer` objects |
| `variants` | array | no | yes | `StorefrontProductVariantSerializer` |

**`ProductImageSerializer`:** `public_id`, `image_url`, `alt`, `order`.

**`StorefrontProductVariantSerializer`:** `public_id`, `sku`, `available_quantity`, `stock_status`, `price` (string, `effective_price`), `options` (array of `{ attribute_public_id, attribute_slug, attribute_name, value_public_id, value }`).  
**Not exposed:** internal fields such as `stock_source`, `is_active` (per serializer docstring).

**Detail envelope** (`get_product_detail` in `products/services.py`) adds on top of serializer output:

| Key | Type | Description |
|-----|------|-------------|
| `breadcrumbs` | string array | `["Home", …category names…, product.name]` |
| `related_products` | array | Up to 4 list-serializer objects |
| `variant_matrix` | object | Map by attribute slug → `{ slug, attribute_public_id, attribute_name, values: [{ value_public_id, value }] }` |

### 3.4 Category — `StorefrontCategorySerializer`

| Field | Type | Nullable | Read-only |
|-------|------|----------|-----------|
| `public_id` | string | no | yes |
| `name` | string | no | yes |
| `slug` | string | no | yes |
| `description` | string | inferred | yes |
| `image_url` | string / null | yes | yes |
| `parent_public_id` | string | yes | yes |
| `order` | int | inferred | yes |

With **`tree=1`**, each node also has **`children`**: array of nested nodes of the same shape.

### 3.5 Catalog filters — `GET /api/v1/catalog/filters/`

From `_fetch_catalog_filters_payload` (`products/services.py`):

| Key | Shape |
|-----|--------|
| `categories` | `[{ public_id, name, slug }]` |
| `attributes` | `{ [attribute_slug]: [{ public_id, value }] }` |
| `brands` | string array |
| `price_range` | `{ min: number, max: number }` |

### 3.6 Unified search — `GET /api/v1/search/`

Response object:

| Key | Type |
|-----|------|
| `products` | array of list-serializer objects |
| `categories` | array of category serializer objects |
| `suggestions` | string array (names, max 10) |
| `trending` | boolean |

### 3.7 Store public — `GET /api/v1/store/public/`

Keys from `StorePublicView.get` (`stores/storefront_views.py`):

| Key | Type | Notes |
|-----|------|--------|
| `store_name` | string | |
| `logo_url` | string / null | Absolute |
| `currency` | string | |
| `currency_symbol` | string | Empty string if unset |
| `country` | string | From `storefront_public` JSON |
| `support_email` | string | From `store.contact_email` |
| `phone` | string | |
| `address` | string | |
| `extra_field_schema` | array | Product-only rows from settings schema |
| `modules_enabled` | object | string keys → boolean |
| `theme_settings` | object | `primary_color` string |
| `seo` | object | `default_title`, `default_description` |
| `policy_urls` | object | `returns`, `refund`, `privacy` |
| `social_links` | object | Profile URLs keyed by platform: `facebook`, `instagram`, `twitter`, `youtube`, `linkedin`, `tiktok`, `pinterest`, `website` (string values, often empty; set from **Settings → Store** in the dashboard, stored in `StoreSettings.storefront_public`) |

### 3.8 Banner — `PublicBannerSerializer`

| Field | Type | Nullable |
|-------|------|----------|
| `public_id` | string | no |
| `title` | string | inferred |
| `image_url` | string | yes |
| `cta_text` | string | inferred |
| `cta_url` | string | from `cta_link`; may be blank |
| `order` | int | inferred |
| `start_at` | string (ISO8601) | yes |
| `end_at` | string (ISO8601) | yes |

### 3.9 Storefront notification (CTA) — `StorefrontNotificationSerializer`

| Field | Type | Notes |
|-------|------|--------|
| `public_id` | string | |
| `cta_text` | string | |
| `notification_type` | string | |
| `cta_url` | string | from `link`; null/blank allowed |
| `cta_label` | string | from `link_text` |
| `order` | int | |
| `is_active` | bool | |
| `is_currently_active` | bool | From model property |
| `start_at` | string / null | ISO from `start_date` |
| `end_at` | string / null | ISO from `end_date` |

### 3.10 Shipping

**Zones** (`build_shipping_zones_catalog`, `shipping/service.py`): array of

| Key | Type |
|-----|------|
| `zone_public_id` | string |
| `name` | string |
| `estimated_days` | string |
| `is_active` | bool |
| `created_at` | string / null (ISO) |
| `updated_at` | string / null (ISO) |
| `cost_rules` | array of `{ min_order_total: float, shipping_cost: float, max_order_total?: float }` |

**Options** (`ShippingOptionSerializer`):  
`rate_public_id`, `method_public_id`, `method_name`, `method_type`, `method_order`, `zone_public_id`, `zone_name`, `price` (decimal), `rate_type`, `min_order_total` (decimal, optional), `max_order_total` (decimal, optional).

**Preview success** (`preview_shipping_for_lines`):  
`shipping_cost` (string), `estimated_days` (string), `currency` (string).

### 3.11 Pricing breakdown response

From `storefront_pricing_breakdown_response` (`orders/pricing.py`):

| Key | Type |
|-----|------|
| `base_subtotal` | string (decimal) |
| `shipping_cost` | string (decimal) |
| `final_total` | string (decimal) |
| `lines` | `[{ product_public_id, quantity, unit_price, line_subtotal }]` — money fields as strings |

### 3.12 Order receipt — `StorefrontOrderReceiptSerializer` (POST `/api/v1/orders/` only)

| Key | Type |
|-----|------|
| `public_id` | string |
| `order_number` | string |
| `status` | string (e.g. `pending`, `confirmed`, `cancelled` — `Order.Status` in `orders/models.py`) |
| `customer_name` | string (shipping name) |
| `phone` | string |
| `shipping_address` | string |
| `items` | array of `{ product_name, quantity, unit_price, total_price, variant_details }` (`variant_details` string or null) |
| `subtotal` | string |
| `shipping_cost` | string |
| `total` | string |

**Not returned** on storefront receipt: full `OrderSerializer` / `OrderItemSerializer` fields (e.g. `pricing_snapshot`, `courier_*`, internal ids).

### 3.13 Support ticket response — `SupportTicketPublicResponseSerializer`

| Field | Type |
|-------|------|
| `public_id` | string |
| `name` | string |
| `email` | string |
| `phone` | string |
| `subject` | string |
| `message` | string |
| `order_number` | string |
| `category` | string |
| `priority` | string |
| `status` | string |
| `created_at` | datetime |
| `updated_at` | datetime |

`internal_notes` is **not** exposed.

### 3.14 Paginated list responses

Product list uses DRF `PageNumberPagination`: response includes `count`, `next`, `previous`, `results` (array of product list objects). Page size **24** (`config/settings/base.py`).

---

## 4. Behavior rules

### 4.1 Pricing

- Line unit price: `unit_price_for_line` (`products/variant_utils.py`) — variant `effective_price` if a variant applies, else `product.price`.
- Subtotals and shipping: `PricingEngine.compute` (`orders/pricing.py`) sums lines, then `quote_shipping` (`shipping/service.py`) for the selected zone (shipping zone required when quoting with zone in engine paths used by checkout/preview).

### 4.2 Variants

`resolve_storefront_variant`: if the product has active variants, **`variant_public_id` is required** and must match an active variant; if the product has no active variants, **`variant_public_id` must be omitted**.

### 4.3 Stock (display vs checkout)

`annotate_storefront_product_stock` and serializer methods drive **display** quantities and `stock_status`. Checkout locks **`Inventory`** rows and validates quantities; then `adjust_stock` runs per line (`orders/views.py`). Comments in `products/services.py` state checkout uses **Inventory** as source of truth.

### 4.4 Order creation

Stateless: no server-side cart session. Customer record: `resolve_and_attach_customer` (`orders/services.py`) matches **`(store, phone)`** and updates counts; optional backfill of empty name/email/address on existing customer.

### 4.5 Throttling

`POST /api/v1/orders/` uses `DirectOrderRateThrottle` (`orders/throttles.py`, scope `direct_order` — **30/hour** per default rates in `config/settings/base.py`).

### 4.6 Caching (behavioral)

Product list, product detail, related products, category list/tree, banners, notifications, and catalog filters use `cache_service` in respective services; keys are tenant-scoped by store `public_id`. Exact TTLs: see `settings` modules and service calls (not repeated here).

---

## 5. Edge cases and status codes

| Situation | Typical response |
|-----------|------------------|
| Missing/invalid `ak_pk_` on storefront path | **401** |
| `ak_sk_` on storefront path | **403** |
| Order create: unknown top-level field | **400** with field names |
| Order create: empty `products` | **400** `No products provided.` |
| Order create: stock failure | **400** `Stock validation failed.` + `errors` list |
| Product search / unified search: query too short | **200** with empty arrays |
| Pricing preview: product missing | **404** |
| Shipping options: missing `zone_public_id` | **400** |
| Shipping preview: bad zone or items | **400** (validation message / dict) |
| Support ticket: serializer errors | **400** |

`GET /api/v1/shipping/options/` with no resolved store returns **200** `[]` (`ShippingOptionsView`); with a valid storefront key the store is normally present.

---

## 6. Frontend integration

### 6.1 Required header

```http
Authorization: Bearer ak_pk_your_publishable_key
```

Use **HTTPS** in production. Do not embed **secret** keys (`ak_sk_`) in browser code.

### 6.2 Recommended flow

1. **`GET /api/v1/store/public/`** — theme, currency, SEO defaults, policy links, `extra_field_schema` for product forms if used.
2. **`GET /api/v1/catalog/filters/`** + **`GET /api/v1/products/`** — browse; use query params for filters and sort.
3. **`GET /api/v1/products/<slug-or-prd_id>/`** — PDP; use `variants` / `variant_matrix` for selectors.
4. **`GET /api/v1/shipping/zones/`** → **`GET /api/v1/shipping/options/`** or **`POST /api/v1/shipping/preview/`** for quotes.
5. **`POST /api/v1/pricing/breakdown/`** — cart totals (merchandise + shipping when zone/method provided).
6. **`POST /api/v1/orders/initiate-checkout/`** when entering checkout (optional analytics).
7. **`POST /api/v1/orders/`** — submit checkout; persist **receipt** payload (order `public_id`, totals, line summaries).

Optional: **`GET /api/v1/banners/`**, **`GET /api/v1/notifications/active/`**, **`GET /api/v1/search/`** or **`/products/search/`**, **`POST /api/v1/support/tickets/`**.

### 6.3 Example (`fetch`)

```javascript
const API = "https://your-domain.com";
const KEY = "ak_pk_..."; // supply from your deployment config

async function storefrontFetch(path, options = {}) {
  const res = await fetch(`${API}/api/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${KEY}`,
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

// Cart checkout
await storefrontFetch("/orders/initiate-checkout/", { method: "POST", body: "{}" });

const receipt = await storefrontFetch("/orders/", {
  method: "POST",
  body: JSON.stringify({
    shipping_zone_public_id: "szn_...",
    shipping_method_public_id: "sm_...",
    shipping_name: "Ada Lovelace",
    phone: "01700000000",
    email: "ada@example.com",
    shipping_address: "House 1, Road 2",
    district: "",
    products: [
      { product_public_id: "prd_...", quantity: 1, variant_public_id: "var_..." },
    ],
  }),
});
```

*(Axios is not used in the backend; the pattern above mirrors standard browser `fetch`.)*

---

## Source files (storefront)

| Area | Path under `api-akkho/` |
|------|-------------------------|
| URL include | `config/urls.py` |
| API key middleware | `engine/core/store_api_key_auth.py` |
| Storefront permission | `engine/core/authz/__init__.py` (`IsStorefrontAPIKey`) |
| Tenancy helpers | `engine/core/tenancy.py` |
| Products | `engine/apps/products/views.py`, `serializers.py`, `services.py` |
| Search | `engine/core/storefront_search_views.py` |
| Store public | `engine/apps/stores/storefront_views.py` |
| Orders / pricing | `engine/apps/orders/views.py`, `serializers.py`, `pricing.py`, `pricing_*_views.py` |
| Shipping | `engine/apps/shipping/views.py`, `service.py`, `serializers.py` |
| Banners | `engine/apps/banners/views.py`, `serializers.py` |
| Notifications | `engine/apps/notifications/views.py`, `serializers.py` |
| Support | `engine/apps/support/views.py`, `serializers.py` |

---

*Storefront-only reference. For dashboard or admin APIs, use internal documentation or the full API inventory maintained separately.*
