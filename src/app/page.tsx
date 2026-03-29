import Link from "next/link";
import type {
  StorefrontProductList,
  StorefrontBanner,
} from "@/types/akkho";
import {
  serverProductApi,
  serverSearchApi,
  serverBannerApi,
  getServerImageUrl,
} from "@/lib/api-server";
import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { ProductSection } from "@/components/common/ProductSection";

const SECTIONS = [
  {
    key: "combo",
    title: "Combo",
    subtitle: "Special combo offers for you",
    category: "combo" as const,
    viewMoreHref: "/products?category=combo",
  },
  {
    key: "couple",
    title: "Couple",
    subtitle: "Perfect matching outfits for couples",
    category: "couple" as const,
    viewMoreHref: "/products?category=couple",
  },
  {
    key: "men",
    title: "Men's",
    subtitle: "Premium men's apparel collection",
    category: "men" as const,
    viewMoreHref: "/products?category=men",
  },
  {
    key: "womens",
    title: "Women's",
    subtitle: "Elegant women's fashion collection",
    category: "womens" as const,
    viewMoreHref: "/products?category=womens",
  },
] as const;

export default async function Home() {
  let trending: StorefrontProductList[] = [];
  let heroBanner: StorefrontBanner | null = null;
  let combo: StorefrontProductList[] = [];
  let couple: StorefrontProductList[] = [];
  let mens: StorefrontProductList[] = [];
  let womens: StorefrontProductList[] = [];

  // Isolate fetches: one failure (e.g. trending) must not drop banners / hero.
  const results = await Promise.allSettled([
    serverSearchApi.trendingProducts(),
    serverBannerApi.getHeroBanner(),
    serverProductApi.getAll(undefined, "combo"),
    serverProductApi.getAll(undefined, "couple"),
    serverProductApi.getAll(undefined, "men"),
    serverProductApi.getAll(undefined, "womens"),
  ]);

  if (results[0].status === "fulfilled") trending = results[0].value;
  if (results[1].status === "fulfilled") heroBanner = results[1].value;
  if (results[2].status === "fulfilled") combo = results[2].value;
  if (results[3].status === "fulfilled") couple = results[3].value;
  if (results[4].status === "fulfilled") mens = results[4].value;
  if (results[5].status === "fulfilled") womens = results[5].value;

  const heroImageUrl = heroBanner?.image_url
    ? getServerImageUrl(heroBanner.image_url)
    : null;

  return (
    <div className="min-h-screen bg-white">
      <Hero imageUrl={heroImageUrl} banner={heroBanner} alt="Hero banner" />

      <section className="container-main section-default">
        <div className="mb-12 text-center">
          <h2 className="section-title font-heading">Trending Products</h2>
          <p className="section-subtitle">Discover our most popular items</p>
        </div>
        {trending.length === 0 ? (
          <div className="empty-state">No trending products available</div>
        ) : (
          <>
            <div className="product-grid">
              {trending.slice(0, 8).map((product) => (
                <ProductCard key={product.public_id} product={product} />
              ))}
            </div>
            {trending.length > 8 && (
              <div className="view-more-wrap">
                <Link
                  href="/products?best_selling=true"
                  className="btn-outline inline-block"
                >
                  View More
                </Link>
              </div>
            )}
          </>
        )}
      </section>

      {SECTIONS.map(({ key, title, subtitle, viewMoreHref }) => {
        const products =
          key === "combo"
            ? combo
            : key === "couple"
              ? couple
              : key === "men"
                ? mens
                : womens;
        return (
          <section key={key}>
            <ProductSection
              title={title}
              subtitle={subtitle}
              products={products}
              viewMoreHref={viewMoreHref}
            />
          </section>
        );
      })}
    </div>
  );
}
