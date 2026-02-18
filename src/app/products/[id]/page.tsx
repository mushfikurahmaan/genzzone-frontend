import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  serverProductApi,
  getServerImageUrl,
} from "@/lib/api-server";
import { ProductDetailClient } from "@/components/products/ProductDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const productId = parseInt(id, 10);
  if (Number.isNaN(productId)) return { title: "Product | GEN-Z ZONE" };
  try {
    const product = await serverProductApi.getById(productId);
    const imageUrl = getServerImageUrl(product.image);
    return {
      title: `${product.name} | GEN-Z ZONE`,
      description: product.description?.slice(0, 160) ?? undefined,
      openGraph: imageUrl ? { images: [{ url: imageUrl }] } : undefined,
    };
  } catch {
    return { title: "Product | GEN-Z ZONE" };
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const productId = parseInt(id, 10);
  if (Number.isNaN(productId)) notFound();

  let product: Awaited<ReturnType<typeof serverProductApi.getById>>;
  try {
    product = await serverProductApi.getById(productId);
  } catch {
    notFound();
  }

  let availableProducts: Awaited<ReturnType<typeof serverProductApi.getAll>> = [];
  try {
    const categorySlug =
      product.category_slug || product.category?.slug;
    const categoryProducts = await serverProductApi.getAll(
      undefined,
      categorySlug || undefined
    );
    availableProducts = categoryProducts
      .filter((p) => p.id !== productId)
      .slice(0, 8);
  } catch {
    // Non-blocking: show product without "You might also like"
  }

  return (
    <ProductDetailClient
      product={product}
      availableProducts={availableProducts}
    />
  );
}
