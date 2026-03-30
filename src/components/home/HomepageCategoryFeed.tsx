import type { HomepageCategoryBlock } from "@/lib/homepageCategoryFeed";
import { CategoryProductBlock } from "@/components/home/CategoryProductBlock";

interface HomepageCategoryFeedProps {
  blocks: HomepageCategoryBlock[];
}

export function HomepageCategoryFeed({ blocks }: HomepageCategoryFeedProps) {
  if (blocks.length === 0) {
    return (
      <div className="container-main section-default">
        <p className="text-center text-muted-foreground">No products available</p>
      </div>
    );
  }

  return (
    <div className="homepage-category-feed">
      {blocks.map((block) => (
        <CategoryProductBlock
          key={block.categoryPublicId}
          categoryPublicId={block.categoryPublicId}
          categorySlug={block.categorySlug}
          products={block.products}
        />
      ))}
    </div>
  );
}
