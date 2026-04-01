import type {
  StorefrontProductList,
  StorefrontBanner,
  StorefrontCategory,
} from "@/types/akkho";
import {
  serverProductApi,
  serverBannerApi,
  serverCategoryApi,
  getServerImageUrl,
} from "@/lib/api-server";
import { Hero } from "@/components/Hero";
import { HomepageCategoryFeed } from "@/components/home/HomepageCategoryFeed";
import { buildHomepageCategoryBlocks } from "@/lib/homepageCategoryFeed";

/** Max catalog pages to merge for homepage grouping (24 products/page → up to 240). */
const HOMEPAGE_FEED_MAX_PAGES = 10;

async function fetchCatalogProductsCapped(): Promise<StorefrontProductList[]> {
  const all: StorefrontProductList[] = [];
  for (let page = 1; page <= HOMEPAGE_FEED_MAX_PAGES; page++) {
    const data = await serverProductApi.getPage({ page });
    all.push(...data.results);
    if (!data.next) break;
  }
  return all;
}

export default async function Home() {
  let heroBanner: StorefrontBanner | null = null;
  let categoryTree: StorefrontCategory[] = [];
  let catalogProducts: StorefrontProductList[] = [];

  const results = await Promise.allSettled([
    serverBannerApi.getHeroBanner(),
    serverCategoryApi.getTree(),
    fetchCatalogProductsCapped(),
  ]);

  const fetchLabels = ["heroBanner", "categoryTree", "catalogProducts"] as const;
  results.forEach((r, idx) => {
    if (r.status === "rejected") {
      const reason =
        r.reason instanceof Error ? r.reason.message : String(r.reason);
      console.error(`[Home SSR fetch failed] ${fetchLabels[idx]}: ${reason}`);
    }
  });

  if (results[0].status === "fulfilled") heroBanner = results[0].value;
  if (results[1].status === "fulfilled") categoryTree = results[1].value;
  if (results[2].status === "fulfilled") catalogProducts = results[2].value;

  const categoryBlocks = buildHomepageCategoryBlocks(
    categoryTree,
    catalogProducts
  );

  if (categoryTree.length === 0 || catalogProducts.length === 0) {
    console.error(
      `[Home SSR data summary] categoryTree=${categoryTree.length} catalogProducts=${catalogProducts.length} blocks=${categoryBlocks.length}`
    );
  }

  const heroImageUrl = heroBanner?.image_url
    ? getServerImageUrl(heroBanner.image_url)
    : null;

  return (
    <div className="min-h-screen bg-white">
      <Hero imageUrl={heroImageUrl} banner={heroBanner} alt="Hero banner" />

      <HomepageCategoryFeed blocks={categoryBlocks} />
    </div>
  );
}
