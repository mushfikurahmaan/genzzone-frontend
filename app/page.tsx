'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Product, BestSelling, productApi, bestSellingApi } from '@/lib/api';
import { Hero } from '@/components/Hero';
import { ProductCard } from '@/components/ProductCard';

export default function Home() {
  const [bestSelling, setBestSelling] = useState<BestSelling[]>([]);
  const [comboProducts, setComboProducts] = useState<Product[]>([]);
  const [mensProducts, setMensProducts] = useState<Product[]>([]);
  const [womensProducts, setWomensProducts] = useState<Product[]>([]);
  
  const [bestSellingLoading, setBestSellingLoading] = useState(true);
  const [comboLoading, setComboLoading] = useState(true);
  const [mensLoading, setMensLoading] = useState(true);
  const [womensLoading, setWomensLoading] = useState(true);
  
  const [bestSellingError, setBestSellingError] = useState<string | null>(null);
  const [comboError, setComboError] = useState<string | null>(null);
  const [mensError, setMensError] = useState<string | null>(null);
  const [womensError, setWomensError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBestSelling() {
      try {
        setBestSellingLoading(true);
        const data = await bestSellingApi.getAll();
        setBestSelling(data);
      } catch (err) {
        setBestSellingError('Failed to load best selling products');
        console.error(err);
      } finally {
        setBestSellingLoading(false);
      }
    }
    fetchBestSelling();
  }, []);

  useEffect(() => {
    async function fetchComboProducts() {
      try {
        setComboLoading(true);
        const data = await productApi.getAll(undefined, 'combo');
        setComboProducts(data);
      } catch (err) {
        setComboError('Failed to load combo products');
        console.error(err);
      } finally {
        setComboLoading(false);
      }
    }
    fetchComboProducts();
  }, []);

  useEffect(() => {
    async function fetchMensProducts() {
      try {
        setMensLoading(true);
        const data = await productApi.getAll(undefined, 'men');
        setMensProducts(data);
      } catch (err) {
        setMensError('Failed to load men\'s products');
        console.error(err);
      } finally {
        setMensLoading(false);
      }
    }
    fetchMensProducts();
  }, []);

  useEffect(() => {
    async function fetchWomensProducts() {
      try {
        setWomensLoading(true);
        const data = await productApi.getAll(undefined, 'womens');
        setWomensProducts(data);
      } catch (err) {
        setWomensError('Failed to load women\'s products');
        console.error(err);
      } finally {
        setWomensLoading(false);
      }
    }
    fetchWomensProducts();
  }, []);

  // Extract products from best selling items
  const bestSellingProducts = bestSelling.map(item => item.product);
  
  // Limit products for display (max 8 per section)
  const displayedBestSelling = bestSellingProducts.slice(0, 8);
  const displayedCombo = comboProducts.slice(0, 8);
  const displayedMens = mensProducts.slice(0, 8);
  const displayedWomens = womensProducts.slice(0, 8);
  
  const hasMoreBestSelling = bestSellingProducts.length > 8;
  const hasMoreCombo = comboProducts.length > 8;
  const hasMoreMens = mensProducts.length > 8;
  const hasMoreWomens = womensProducts.length > 8;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <Hero />

      {/* Trending Products Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-black" style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}>Trending Products</h2>
          <p className="text-sm text-gray-600">Discover our most popular items</p>
        </div>
        {bestSellingLoading ? (
          <div className="text-center py-16">
            <div className="text-lg text-gray-600">Loading best selling products...</div>
          </div>
        ) : bestSellingError ? (
          <div className="text-center py-16">
            <div className="text-lg text-red-600">{bestSellingError}</div>
          </div>
        ) : bestSellingProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-lg text-gray-600">No best selling products available</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6">
              {displayedBestSelling.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {hasMoreBestSelling && (
              <div className="text-center mt-6 md:mt-8">
                <Link
                  href="/products?best_selling=true"
                  className="inline-block px-6 md:px-8 py-2 md:py-3 border-2 border-black text-black hover:bg-black hover:text-white transition-colors rounded font-medium text-sm md:text-base"
                >
                  View More
                </Link>
              </div>
            )}
          </>
        )}
      </section>

      {/* Combo Section */}
      <section className="container mx-auto px-4 py-16 bg-gray-50">
        <div className="mb-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-black" style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}>Combo</h2>
          <p className="text-sm text-gray-600">Special combo offers for you</p>
        </div>
        {comboLoading ? (
          <div className="text-center py-16">
            <div className="text-lg text-gray-600">Loading combo products...</div>
          </div>
        ) : comboError ? (
          <div className="text-center py-16">
            <div className="text-lg text-red-600">{comboError}</div>
          </div>
        ) : comboProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-lg text-gray-600">No combo products available</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6">
              {displayedCombo.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {hasMoreCombo && (
              <div className="text-center mt-6 md:mt-8">
                <Link
                  href="/products?category=combo"
                  className="inline-block px-6 md:px-8 py-2 md:py-3 border-2 border-black text-black hover:bg-black hover:text-white transition-colors rounded font-medium text-sm md:text-base"
                >
                  View More
                </Link>
              </div>
            )}
          </>
        )}
      </section>

      {/* Men's Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-black" style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}>Men's</h2>
          <p className="text-sm text-gray-600">Premium men's apparel collection</p>
        </div>
        {mensLoading ? (
          <div className="text-center py-16">
            <div className="text-lg text-gray-600">Loading men's products...</div>
          </div>
        ) : mensError ? (
          <div className="text-center py-16">
            <div className="text-lg text-red-600">{mensError}</div>
          </div>
        ) : mensProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-lg text-gray-600">No men's products available</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6">
              {displayedMens.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {hasMoreMens && (
              <div className="text-center mt-6 md:mt-8">
                <Link
                  href="/products?category=men"
                  className="inline-block px-6 md:px-8 py-2 md:py-3 border-2 border-black text-black hover:bg-black hover:text-white transition-colors rounded font-medium text-sm md:text-base"
                >
                  View More
                </Link>
              </div>
            )}
          </>
        )}
      </section>

      {/* Women's Section */}
      <section className="container mx-auto px-4 py-16 bg-gray-50">
        <div className="mb-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-black" style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}>Women's</h2>
          <p className="text-sm text-gray-600">Elegant women's fashion collection</p>
        </div>
        {womensLoading ? (
          <div className="text-center py-16">
            <div className="text-lg text-gray-600">Loading women's products...</div>
          </div>
        ) : womensError ? (
          <div className="text-center py-16">
            <div className="text-lg text-red-600">{womensError}</div>
          </div>
        ) : womensProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-lg text-gray-600">No women's products available</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6">
              {displayedWomens.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {hasMoreWomens && (
              <div className="text-center mt-6 md:mt-8">
                <Link
                  href="/products?category=womens"
                  className="inline-block px-6 md:px-8 py-2 md:py-3 border-2 border-black text-black hover:bg-black hover:text-white transition-colors rounded font-medium text-sm md:text-base"
                >
                  View More
                </Link>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
