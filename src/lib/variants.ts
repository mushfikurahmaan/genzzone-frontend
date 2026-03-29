import type {
  StorefrontProductDetail,
  StorefrontProductVariant,
} from "@/types/akkho";

/** Build initial selection: first value per attribute in variant_matrix */
export function defaultVariantSelection(
  product: StorefrontProductDetail
): Record<string, string> {
  const matrix = product.variant_matrix;
  if (matrix && Object.keys(matrix).length > 0) {
    const out: Record<string, string> = {};
    for (const attr of Object.values(matrix)) {
      const first = attr.values[0];
      if (first) out[attr.slug] = first.value_public_id;
    }
    return out;
  }
  const first = product.variants?.[0];
  if (!first) return {};
  const out: Record<string, string> = {};
  for (const o of first.options) {
    out[o.attribute_slug] = o.value_public_id;
  }
  return out;
}

export function matrixAttributeSlugs(
  product: StorefrontProductDetail
): string[] {
  const matrix = product.variant_matrix;
  if (matrix && Object.keys(matrix).length > 0) {
    return Object.values(matrix).map((a) => a.slug);
  }
  const first = product.variants?.[0];
  if (!first) return [];
  return first.options.map((o) => o.attribute_slug);
}

export function findVariantForSelection(
  product: StorefrontProductDetail,
  selectedBySlug: Record<string, string>
): StorefrontProductVariant | null {
  if (!product.variants?.length) return null;
  const slugs = matrixAttributeSlugs(product);
  if (slugs.length === 0) return null;
  if (!slugs.every((s) => selectedBySlug[s])) return null;

  return (
    product.variants.find((v) =>
      slugs.every((slug) => {
        const sel = selectedBySlug[slug];
        const opt = v.options.find((o) => o.attribute_slug === slug);
        return opt != null && opt.value_public_id === sel;
      })
    ) ?? null
  );
}

export function requiresVariant(product: StorefrontProductDetail): boolean {
  return product.variant_count > 0;
}
