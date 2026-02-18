'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { getImageUrl } from '@/lib/api';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { cart, loading, updateCartItem, removeCartItem, clearCart } = useCart();
  const [updating, setUpdating] = useState<number | null>(null);

  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdating(itemId);
    try {
      await updateCartItem(itemId, newQuantity);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update quantity');
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (confirm('Remove this item from cart?')) {
      try {
        await removeCartItem(itemId);
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to remove item');
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-lg text-gray-600">Loading cart...</div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Add some products to get started!</p>
          <button
            onClick={() => router.push('/products')}
            className="px-8 py-3 bg-black text-white rounded hover:bg-gray-800 transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 flex flex-col md:flex-row gap-4"
            >
              {/* Product Image */}
              <Link
                href={`/products/${item.product.id}`}
                className="relative w-full md:w-32 h-48 md:h-32 bg-gray-200 rounded overflow-hidden flex-shrink-0"
              >
                {getImageUrl(item.product.image) ? (
                  <Image
                    src={getImageUrl(item.product.image)!}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">No Image</span>
                  </div>
                )}
              </Link>

              {/* Product Details */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <Link
                    href={`/products/${item.product.id}`}
                    className="text-lg font-semibold text-black hover:underline mb-2 block"
                  >
                    {item.product.name}
                  </Link>
                  <div className="text-sm text-gray-600 mb-2">
                    {item.product.has_offer && item.product.offer_price ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 line-through">
                          ৳{parseFloat(item.product.regular_price).toFixed(0)}.00
                        </span>
                        <span className="font-normal text-black">
                          ৳{parseFloat(item.product.offer_price).toFixed(0)}.00
                        </span>
                      </div>
                    ) : (
                      <span className="font-normal text-black">
                        ৳{parseFloat(item.product.regular_price).toFixed(0)}.00
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Stock: {item.product.stock} available
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={updating === item.id || item.quantity <= 1}
                      className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">
                      {updating === item.id ? '...' : item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={updating === item.id || item.quantity >= item.product.stock}
                      className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="font-normal text-lg">
                      ৳{parseFloat(item.subtotal).toFixed(0)}.00
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="mt-2 text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Clear Cart Button */}
          <div className="pt-4">
            <button
              onClick={() => {
                if (confirm('Clear entire cart?')) {
                  clearCart();
                }
              }}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Clear Cart
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Items ({cart.item_count})</span>
                <span className="font-medium">৳{parseFloat(cart.total).toFixed(0)}.00</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-normal">
                  <span>Total</span>
                  <span>৳{parseFloat(cart.total).toFixed(0)}.00</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/products')}
              className="w-full py-3 mt-3 border-2 border-black text-black rounded hover:bg-black hover:text-white transition-colors font-medium"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

