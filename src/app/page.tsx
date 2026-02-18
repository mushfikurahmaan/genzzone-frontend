import Link from "next/link";
import type { BestSelling, HeroImage, Product } from "@/types/api";
import {
  serverBestSellingApi,
  serverProductApi,
  serverHeroImageApi,
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
  let bestSelling: BestSelling[] = [];
  let heroImage: HeroImage | null = null;
  let combo: Product[] = [];
  let couple: Product[] = [];
  let mens: Product[] = [];
  let womens: Product[] = [];

  try {
    const [bestSellingRes, heroImageRes, comboRes, coupleRes, mensRes, womensRes] =
      await Promise.all([
        serverBestSellingApi.getAll(),
        serverHeroImageApi.getActive(),
        serverProductApi.getAll(undefined, "combo"),
        serverProductApi.getAll(undefined, "couple"),
        serverProductApi.getAll(undefined, "men"),
        serverProductApi.getAll(undefined, "womens"),
      ]);
    bestSelling = bestSellingRes;
    heroImage = heroImageRes;
    combo = comboRes;
    couple = coupleRes;
    mens = mensRes;
    womens = womensRes;
  } catch (_) {
    // API unreachable or error: render page with empty sections
  }

  const bestSellingProducts = bestSelling.map((item) => item.product);
  const heroUrl = heroImage?.image
    ? getServerImageUrl(heroImage.image)
    : null;

  return (
    <div className="min-h-screen bg-white">
      <Hero imageUrl={heroUrl} alt="Hero banner" />

      <section className="container-main section-default">
        <div className="mb-12 text-center">
          <h2 className="section-title font-heading">Trending Products</h2>
          <p className="section-subtitle">Discover our most popular items</p>
        </div>
        {bestSellingProducts.length === 0 ? (
          <div className="empty-state">No best selling products available</div>
        ) : (
          <>
            <div className="product-grid">
              {bestSellingProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {bestSellingProducts.length > 8 && (
              <div className="view-more-wrap">
                <Link href="/products?best_selling=true" className="btn-outline inline-block">
                  View More
                </Link>
              </div>
            )}
          </>
        )}
      </section>

      {SECTIONS.map(({ key, title, subtitle, viewMoreHref }, i) => {
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
