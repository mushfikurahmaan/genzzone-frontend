import type {
  StorefrontCategory,
  StorefrontProductList,
} from "@/types/akkho";

/** One category’s full product list (ordering only; UI slices to 12). */
export interface HomepageCategoryBlock {
  categoryPublicId: string;
  products: StorefrontProductList[];
  categorySlug: string;
}

export function flattenCategoryTree(
  categories: StorefrontCategory[]
): StorefrontCategory[] {
  const out: StorefrontCategory[] = [];
  const walk = (nodes: StorefrontCategory[] | undefined) => {
    if (!nodes?.length) return;
    for (const n of nodes) {
      out.push(n);
      walk(n.children);
    }
  };
  walk(categories);
  return out;
}

export function groupProductsByCategoryPublicId(
  products: StorefrontProductList[]
): Map<string, StorefrontProductList[]> {
  const map = new Map<string, StorefrontProductList[]>();
  for (const p of products) {
    const id = p.category_public_id?.trim() || "__uncategorized__";
    let list = map.get(id);
    if (!list) {
      list = [];
      map.set(id, list);
    }
    list.push(p);
  }
  return map;
}

export function orderCategoryGroups(
  map: Map<string, StorefrontProductList[]>,
  flatCategories: StorefrontCategory[]
): HomepageCategoryBlock[] {
  const used = new Set<string>();
  const blocks: HomepageCategoryBlock[] = [];

  for (const cat of flatCategories) {
    const list = map.get(cat.public_id);
    if (!list?.length) continue;
    used.add(cat.public_id);
    blocks.push({
      categoryPublicId: cat.public_id,
      products: list,
      categorySlug: list[0]!.category_slug,
    });
  }

  const rest: string[] = [];
  for (const key of map.keys()) {
    if (used.has(key)) continue;
    const list = map.get(key);
    if (list?.length) rest.push(key);
  }
  rest.sort();

  for (const key of rest) {
    const list = map.get(key)!;
    blocks.push({
      categoryPublicId: key,
      products: list,
      categorySlug: list[0]!.category_slug,
    });
  }

  return blocks;
}

export function buildHomepageCategoryBlocks(
  categoryTree: StorefrontCategory[],
  products: StorefrontProductList[]
): HomepageCategoryBlock[] {
  if (products.length === 0) return [];
  const map = groupProductsByCategoryPublicId(products);
  const flat = flattenCategoryTree(categoryTree);
  return orderCategoryGroups(map, flat);
}
