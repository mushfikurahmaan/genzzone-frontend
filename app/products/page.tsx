'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Product, BestSelling, productApi, bestSellingApi } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const bestSellingParam = searchParams.get('best_selling');
  const isBestSelling = bestSellingParam === 'true';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        if (isBestSelling) {
          // Fetch best selling products
          const bestSellingData = await bestSellingApi.getAll();
          const bestSellingProducts = bestSellingData.map(item => item.product);
          setProducts(bestSellingProducts);
        } else {
          // Fetch regular products with optional category filter and search
          const data = await productApi.getAll(search || undefined, category || undefined);
          setProducts(data);
        }
      } catch (err) {
        setError('Failed to load products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [category, search, isBestSelling]);

  const getCategoryTitle = () => {
    if (isBestSelling) return 'Best Selling Products';
    if (search) return `Search Results for "${search}"`;
    if (!category) return 'All Products';
    const categoryMap: Record<string, string> = {
      men: 'Men\'s Products',
      men_shirt: 'Men\'s Shirts',
      men_panjabi: 'Men\'s Panjabi',
      womens: 'Women\'s Products',
      combo: 'Combo Products',
    };
    return categoryMap[category] || 'Products';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-black">
            {getCategoryTitle()}
          </h1>
          <p className="text-lg text-gray-700">
            {isBestSelling
              ? 'Discover Our Most Popular Premium T-Shirts'
              : category 
                ? `Discover our premium ${category === 'men' ? 'men\'s' : category === 'men_shirt' ? 'men\'s shirts' : category === 'men_panjabi' ? 'men\'s panjabi' : category === 'womens' ? 'women\'s' : 'combo'} collection`
                : 'Explore Our Complete Collection of Premium Apparel'
            }
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="text-lg text-gray-600">Loading products...</div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="text-lg text-red-600">{error}</div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-lg text-gray-600">
              {search
                ? `No products found matching "${search}". Try a different search term.`
                : isBestSelling 
                  ? 'No best selling products available'
                  : category 
                    ? `No ${category} products available` 
                    : 'No products available'
              }
            </div>
            {search && (
              <Link
                href="/products"
                className="mt-4 inline-block px-6 py-2 border-2 border-black text-black hover:bg-black hover:text-white transition-colors rounded"
              >
                View All Products
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center py-16">
            <div className="text-lg text-gray-600">Loading products...</div>
          </div>
        </div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}

