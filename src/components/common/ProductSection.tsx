import Link from "next/link";
import type { Product } from "@/types/api";
import { ProductCard } from "@/components/ProductCard";

const MAX_PRODUCTS = 8;

interface ProductSectionProps {
  title: string;
  subtitle: string;
  products: Product[];
  viewMoreHref: string;
}

export function ProductSection({
  title,
  subtitle,
  products,
  viewMoreHref,
}: ProductSectionProps) {
  const displayed = products.slice(0, MAX_PRODUCTS);
  const hasMore = products.length > MAX_PRODUCTS;

  return (
    <section className="container-main section-default">
      <div className="mb-12 text-center">
        <h2 className="section-title font-heading">{title}</h2>
        <p className="section-subtitle">{subtitle}</p>
      </div>
      {products.length === 0 ? (
        <p className="text-center text-muted-foreground">No products available</p>
      ) : (
        <>
          <div className="product-grid">
            {displayed.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {hasMore && (
            <div className="view-more-wrap">
              <Link href={viewMoreHref} className="btn-outline inline-block">
                View More
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}
