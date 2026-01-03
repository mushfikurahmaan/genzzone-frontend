'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Product, productApi, getImageUrl, orderApi, CreateMultiProductOrderData } from '@/lib/api';
import { ArrowLeft, Plus, X, Minus } from 'lucide-react';
import Image from 'next/image';

interface OrderItem {
  product: Product;
  quantity: number;
  product_size: string;
}

function OrderPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get('productId') ? parseInt(searchParams.get('productId')!) : null;

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    customer_name: '',
    district: 'outside_dhaka',
    address: '',
    phone_number: '',
  });
  
  // Size options (excluding the placeholder)
  const sizeOptions = [
    { value: 'M', label: 'M' },
    { value: 'L', label: 'L' },
    { value: 'XL', label: 'XL' },
  ];
  
  // Calculate delivery charge based on district selection
  const getDeliveryCharge = () => {
    if (!formData.district) return 0;
    return formData.district === 'inside_dhaka' ? 80 : 150;
  };

  // Get district value for API (map to backend format)
  const getDistrictForAPI = () => {
    if (formData.district === 'inside_dhaka') return 'Dhaka';
    if (formData.district === 'outside_dhaka') return 'Outside Dhaka';
    return formData.district;
  };

  useEffect(() => {
    async function fetchProduct() {
      if (!productId) {
        setError('পণ্য নির্বাচন করা হয়নি');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await productApi.getById(productId);
        // Initialize with the first product
        setOrderItems([{
          product: data,
          quantity: 1,
          product_size: '',
        }]);
      } catch (err) {
        setError('পণ্য পাওয়া যায়নি');
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    async function fetchAvailableProducts() {
      if (!showProductSelector) return;
      
      try {
        setLoadingProducts(true);
        const products = await productApi.getAll();
        // Filter out products that are already in the order
        const existingProductIds = orderItems.map(item => item.product.id);
        const filteredProducts = products.filter(p => !existingProductIds.includes(p.id) && p.stock > 0);
        setAvailableProducts(filteredProducts);
      } catch (err) {
        // Silently handle error
      } finally {
        setLoadingProducts(false);
      }
    }
    fetchAvailableProducts();
  }, [showProductSelector, orderItems]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemQuantityChange = (index: number, quantity: number) => {
    setOrderItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity: Math.max(1, Math.min(quantity, item.product.stock)) } : item
    ));
  };

  const handleItemSizeChange = (index: number, size: string) => {
    setOrderItems(prev => prev.map((item, i) => 
      i === index ? { ...item, product_size: item.product_size === size ? '' : size } : item
    ));
  };

  const handleAddProduct = (product: Product) => {
    setOrderItems(prev => [...prev, {
      product,
      quantity: 1,
      product_size: '',
    }]);
    setShowProductSelector(false);
  };

  const handleRemoveProduct = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };
  
  // Calculate totals
  const getProductTotal = () => {
    return orderItems.reduce((sum, item) => {
      return sum + (parseFloat(item.product.current_price) * item.quantity);
    }, 0);
  };

  const getTotalPrice = () => {
    return getProductTotal() + getDeliveryCharge();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (orderItems.length === 0) {
      setError('অনুগ্রহ করে অন্তত একটি পণ্য যোগ করুন');
      return;
    }

    // Validate form
    if (!formData.customer_name.trim()) {
      setError('অনুগ্রহ করে আপনার নাম লিখুন');
      return;
    }
    if (!formData.district) {
      setError('অনুগ্রহ করে ডেলিভারি এলাকা নির্বাচন করুন');
      return;
    }
    if (!formData.address.trim()) {
      setError('অনুগ্রহ করে আপনার ঠিকানা লিখুন');
      return;
    }
    if (!formData.phone_number.trim()) {
      setError('অনুগ্রহ করে আপনার মোবাইল নাম্বার লিখুন');
      return;
    }

    // Validate all items
    for (const item of orderItems) {
      if (item.quantity < 1) {
        setError(`${item.product.name} এর পরিমাণ কমপক্ষে 1 হতে হবে`);
        return;
      }
      if (item.quantity > item.product.stock) {
        setError(`${item.product.name} এর জন্য স্টকে শুধুমাত্র ${item.product.stock}টি আইটেম রয়েছে`);
        return;
      }
    }

    setError(null);
    setSubmitting(true);

    try {
      // Build products array for multi-product order
      const products = orderItems.map(item => {
        const unitPrice = parseFloat(item.product.current_price);
        const itemTotal = unitPrice * item.quantity;
        
        return {
          product_id: item.product.id,
          product_name: item.product.name,
          product_size: item.product_size.trim() || '',
          quantity: item.quantity,
          unit_price: parseFloat(unitPrice.toFixed(2)),
          product_total: parseFloat(itemTotal.toFixed(2)),
        };
      });

      // Create single order with multiple products
      const orderData: CreateMultiProductOrderData = {
        customer_name: formData.customer_name.trim(),
        district: getDistrictForAPI(),
        address: formData.address.trim(),
        phone_number: formData.phone_number.trim(),
        products: products,
        product_total: parseFloat(getProductTotal().toFixed(2)),
        delivery_charge: getDeliveryCharge(),
        total_price: parseFloat(getTotalPrice().toFixed(2)),
      };

      await orderApi.createMultiProduct(orderData);
      setSuccess(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        'অর্ডার তৈরি করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-lg text-gray-600">লোড হচ্ছে...</div>
      </div>
    );
  }

  if (error && orderItems.length === 0 && !loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-lg text-red-600 mb-4">{error}</div>
        <button
          onClick={() => router.push('/')}
          className="mx-auto block px-6 py-2 border-2 border-black text-black hover:bg-black hover:text-white transition-colors rounded"
        >
          হোম পেজে ফিরে যান
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-green-800 mb-4">অর্ডার সফলভাবে দেওয়া হয়েছে!</h2>
            <p className="text-gray-700 mb-2">আপনার অর্ডারের জন্য ধন্যবাদ, {formData.customer_name}!</p>
            <p className="text-gray-600 text-sm">আপনাকে শীঘ্রই হোম পেজে নিয়ে যাওয়া হবে...</p>
          </div>
        </div>
      </div>
    );
  }

  if (orderItems.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-black hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-black mb-8">অর্ডার করতে নিচের তথ্যগুলি দিন</h1>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Product Summary */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-black mb-4">Order Summary</h2>
              
              {/* Products List */}
              <div className="space-y-4 mb-4">
                {orderItems.map((item, index) => {
                  const isOutOfStock = item.product.stock === 0;
                  return (
                    <div key={`${item.product.id}-${index}`} className="border border-gray-200 rounded p-4">
                      <div className="flex gap-4 mb-3">
                        {getImageUrl(item.product.image) ? (
                          <div className="relative w-20 h-20 flex-shrink-0">
                            <Image
                              src={getImageUrl(item.product.image)!}
                              alt={item.product.name}
                              fill
                              className="object-cover rounded"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <a
                                href={`/products/${item.product.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-black mb-1 hover:underline cursor-pointer block"
                              >
                                {item.product.name}
                              </a>
                              <p className="text-sm text-gray-600 capitalize mb-1">{item.product.category}</p>
                              <div className="text-base font-normal text-black">
                                ৳{parseFloat(item.product.current_price).toFixed(0)}.00
                              </div>
                            </div>
                            {orderItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveProduct(index)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Remove product"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Quantity Selector */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-black mb-2">
                          পরিমাণ <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleItemQuantityChange(index, item.quantity - 1)}
                            disabled={isOutOfStock || item.quantity <= 1}
                            className="w-10 h-10 border-2 border-gray-300 rounded flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-16 text-center font-medium text-lg">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleItemQuantityChange(index, item.quantity + 1)}
                            disabled={isOutOfStock || item.quantity >= item.product.stock}
                            className="w-10 h-10 border-2 border-gray-300 rounded flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          In Stock: {item.product.stock}
                        </p>
                      </div>

                      {/* Size Selector */}
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-black mb-2">
                          পণ্যের সাইজ
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {sizeOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleItemSizeChange(index, option.value)}
                              className={`px-3 py-1 text-sm border-2 rounded transition-colors font-medium cursor-pointer ${
                                item.product_size === option.value
                                  ? 'bg-black text-white border-black'
                                  : 'bg-white text-black border-gray-300 hover:border-black'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {isOutOfStock && (
                        <div className="bg-red-50 border border-red-200 rounded p-2 text-red-700 text-xs mt-2">
                          এই পণ্যটি বর্তমানে স্টকে নেই।
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Another Product Button */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowProductSelector(!showProductSelector)}
                  className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded hover:border-black hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-black"
                >
                  <Plus className="w-4 h-4" />
                  আরেকটি পণ্য যোগ করুন
                </button>
              </div>

              {/* Product Selector */}
              {showProductSelector && (
                <div className="mb-4 border-2 border-gray-200 rounded p-4 max-h-64 overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-black">পণ্য নির্বাচন করুন</h3>
                    <button
                      type="button"
                      onClick={() => setShowProductSelector(false)}
                      className="text-gray-500 hover:text-black"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {loadingProducts ? (
                    <div className="text-center py-4 text-sm text-gray-600">লোড হচ্ছে...</div>
                  ) : availableProducts.length === 0 ? (
                    <div className="text-center py-4 text-sm text-gray-600">কোন পণ্য পাওয়া যায়নি</div>
                  ) : (
                    <div className="space-y-2">
                      {availableProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleAddProduct(product)}
                          className="w-full text-left p-2 border border-gray-200 rounded hover:border-black hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-medium text-sm text-black">{product.name}</div>
                          <div className="text-xs text-gray-600">৳{parseFloat(product.current_price).toFixed(0)}.00</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Price Summary - Always visible and updates immediately */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>পণ্যের মোট:</span>
                    <span>৳{getProductTotal().toFixed(0)}.00</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>ডেলিভারি চার্জ:</span>
                    <span>৳{getDeliveryCharge()}.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-black text-lg pt-2 border-t border-gray-200">
                    <span>মোট:</span>
                    <span>৳{getTotalPrice().toFixed(0)}.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Form */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-black mb-6">গ্রাহকের তথ্য</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="customer_name" className="block text-sm font-medium text-black mb-2">
                    নাম <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="customer_name"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-black"
                    placeholder="আপনার নাম"
                  />
                </div>

                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-black mb-2">
                    মোবাইল নাম্বার <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-black"
                    placeholder="১১ ডিজিট মোবাইল নাম্বার"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-black mb-2">
                    ঠিকানা <span className="text-red-500">*</span> <span className="text-gray-600 font-normal">(গ্রাম/থানা/জেলা)</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-black resize-none"
                    placeholder="আপনার ঠিকানা"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    ডেলিভারি এলাকা <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="district"
                          value="inside_dhaka"
                          checked={formData.district === 'inside_dhaka'}
                          onChange={handleInputChange}
                          required
                          className="w-4 h-4 text-black border-2 border-gray-300 focus:outline-none cursor-pointer"
                        />
                        <span className="ml-3 text-black">ঢাকা সিটির ভেতরে</span>
                      </div>
                      <span className="text-black font-semibold">৳80</span>
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="district"
                          value="outside_dhaka"
                          checked={formData.district === 'outside_dhaka'}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-black border-2 border-gray-300 focus:outline-none cursor-pointer"
                        />
                        <span className="ml-3 text-black">ঢাকা সিটির বাহিরে</span>
                      </div>
                      <span className="text-black font-semibold">৳150</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || orderItems.length === 0 || orderItems.some(item => item.product.stock === 0)}
                  className={`w-full py-3 px-6 rounded border-2 border-black text-base font-medium transition-colors ${
                    submitting || orderItems.length === 0 || orderItems.some(item => item.product.stock === 0)
                      ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                      : 'bg-white text-black hover:bg-black hover:text-white'
                  }`}
                >
                  {submitting ? 'অর্ডার দেওয়া হচ্ছে...' : orderItems.some(item => item.product.stock === 0) ? 'কিছু পণ্য স্টকে নেই' : 'অর্ডার করুন'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-lg text-gray-600">লোড হচ্ছে...</div>
      </div>
    }>
      <OrderPageContent />
    </Suspense>
  );
}

