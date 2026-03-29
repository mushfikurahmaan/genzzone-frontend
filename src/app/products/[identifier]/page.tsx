import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  serverProductApi,
  getServerImageUrl,
} from "@/lib/api-server";
import { ProductDetailClient } from "@/components/products/ProductDetailClient";

interface PageProps {
  params: Promise<{ identifier: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { identifier } = await params;
  if (!identifier?.trim()) return { title: "Product | GEN-Z ZONE" };
  try {
    const product = await serverProductApi.getByIdentifier(identifier);
    const primary =
      product.images?.find((i) => i.order === 0) ?? product.images?.[0];
    const imageUrl = getServerImageUrl(
      primary?.image_url ?? product.image_url
    );
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
  const { identifier } = await params;
  if (!identifier?.trim()) notFound();

  let product: Awaited<ReturnType<typeof serverProductApi.getByIdentifier>>;
  try {
    product = await serverProductApi.getByIdentifier(identifier);
  } catch {
    notFound();
  }

  const related =
    product.related_products?.filter(
      (p) => p.public_id !== product.public_id
    ) ?? [];

  return (
    <ProductDetailClient product={product} relatedProducts={related} />
  );
}
