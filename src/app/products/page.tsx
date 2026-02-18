import type { Metadata } from "next";
import Link from "next/link";
import {
  serverProductApi,
  serverBestSellingApi,
} from "@/lib/api-server";
import { ProductCard } from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "Products | GEN-Z ZONE",
  description:
    "Explore our complete collection of premium apparel, combos, and more.",
};

const CATEGORY_TITLES: Record<string, string> = {
  men: "Men's Products",
  men_shirt: "Men's Shirts",
  men_panjabi: "Men's Panjabi",
  womens: "Women's Products",
  combo: "Combo Products",
  couple: "Couple Products",
};

function getCategoryTitle(
  category: string | null,
  search: string | null,
  isBestSelling: boolean
) {
  if (isBestSelling) return "Best Selling Products";
  if (search) return `Search Results for "${search}"`;
  if (!category) return "All Products";
  return CATEGORY_TITLES[category] ?? "Products";
}

function getSubtitle(
  category: string | null,
  search: string | null,
  isBestSelling: boolean
) {
  if (search) return null;
  if (isBestSelling) return "Discover Our Most Popular Premium T-Shirts";
  if (category === "men") return "Discover our premium men's collection";
  if (category === "men_shirt") return "Discover our premium men's shirts";
  if (category === "men_panjabi") return "Discover our premium men's panjabi";
  if (category === "womens") return "Discover our premium women's collection";
  if (category === "combo") return "Discover our combo collection";
  if (category) return "Discover our premium collection";
  return "Explore Our Complete Collection of Premium Apparel";
}

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string; best_selling?: string }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const category = params.category ?? null;
  const search = params.search ?? null;
  const isBestSelling = params.best_selling === "true";

  let products: Awaited<ReturnType<typeof serverProductApi.getAll>>;
  try {
    if (isBestSelling) {
      const bestSelling = await serverBestSellingApi.getAll();
      products = bestSelling.map((item) => item.product);
    } else {
      products = await serverProductApi.getAll(
        search ?? undefined,
        category ?? undefined
      );
    }
  } catch {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="error-state">Failed to load products</div>
        </div>
      </div>
    );
  }

  const title = getCategoryTitle(category, search, isBestSelling);
  const subtitle = getSubtitle(category, search, isBestSelling);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        <header className="mb-12 text-center">
          <h1 className="section-title font-heading">{title}</h1>
          {subtitle && (
            <p className="text-lg text-muted-foreground">{subtitle}</p>
          )}
        </header>

        {products.length === 0 ? (
          <div className="empty-state">
            {search
              ? `No products found matching "${search}". Try a different search term.`
              : isBestSelling
                ? "No best selling products available"
                : category
                  ? `No ${category} products available`
                  : "No products available"}
            {search && (
              <Link href="/products" className="btn-outline mt-4 inline-block">
                View All Products
              </Link>
            )}
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
