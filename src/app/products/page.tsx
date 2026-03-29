import type { Metadata } from "next";
import Link from "next/link";
import { serverProductApi, serverSearchApi } from "@/lib/api-server";
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
  if (isBestSelling) return "Discover our most popular items";
  if (category === "men") return "Discover our premium men's collection";
  if (category === "men_shirt") return "Discover our premium men's shirts";
  if (category === "men_panjabi") return "Discover our premium men's panjabi";
  if (category === "womens") return "Discover our premium women's collection";
  if (category === "combo") return "Discover our combo collection";
  if (category) return "Discover our premium collection";
  return "Explore Our Complete Collection of Premium Apparel";
}

interface PageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    best_selling?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const category = params.category ?? null;
  const search = params.search ?? null;
  const isBestSelling = params.best_selling === "true";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  try {
    let list;
    if (isBestSelling) {
      const products = await serverSearchApi.trendingProducts();
      list = {
        count: products.length,
        next: null,
        previous: null,
        results: products,
      };
    } else {
      list = await serverProductApi.getPage({
        page,
        search: search ?? undefined,
        category: category ?? undefined,
      });
    }

    const title = getCategoryTitle(category, search, isBestSelling);
    const subtitle = getSubtitle(category, search, isBestSelling);
    const totalPages = Math.max(1, Math.ceil(list.count / 24));
    const hasPrev = !!list.previous;
    const hasNext = !!list.next;

    const q = new URLSearchParams();
    if (category) q.set("category", category);
    if (search) q.set("search", search);
    if (isBestSelling) q.set("best_selling", "true");

    const pageLink = (p: number) => {
      const qp = new URLSearchParams(q);
      if (p > 1) qp.set("page", String(p));
      const s = qp.toString();
      return s ? `/products?${s}` : "/products";
    };

    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16">
          <header className="mb-12 text-center">
            <h1 className="section-title font-heading">{title}</h1>
            {subtitle && (
              <p className="text-lg text-muted-foreground">{subtitle}</p>
            )}
          </header>

          {list.results.length === 0 ? (
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
            <>
              <div className="product-grid">
                {list.results.map((product) => (
                  <ProductCard key={product.public_id} product={product} />
                ))}
              </div>
              {!isBestSelling && totalPages > 1 && (
                <nav
                  className="mt-12 flex flex-wrap items-center justify-center gap-4"
                  aria-label="Pagination"
                >
                  {hasPrev ? (
                    <Link href={pageLink(page - 1)} className="btn-outline">
                      Previous
                    </Link>
                  ) : (
                    <span className="btn-outline opacity-50 pointer-events-none">
                      Previous
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  {hasNext ? (
                    <Link href={pageLink(page + 1)} className="btn-outline">
                      Next
                    </Link>
                  ) : (
                    <span className="btn-outline opacity-50 pointer-events-none">
                      Next
                    </span>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    );
  } catch {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="error-state">Failed to load products</div>
        </div>
      </div>
    );
  }
}
