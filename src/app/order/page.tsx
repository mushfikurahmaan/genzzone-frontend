'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Product, ProductColor, ProductSizeOption, productApi, getImageUrl, orderApi, CreateMultiProductOrderData, CreateOrderProductItem, Order, ensureCsrfCookie } from '@/lib/api';
import { ArrowLeft, Plus, X, Minus, CheckCircle, Download, ShoppingBag, Eye } from 'lucide-react';
import Image from 'next/image';
import { generateOrderPDF, OrderPDFData } from '@/lib/generateOrderPDF';

const DEFAULT_SIZE_OPTIONS: ProductSizeOption[] = [{ label: 'Size', options: ['One Size'] }];

function getSizeOptions(product: Product): ProductSizeOption[] {
  if (product.size_options && Array.isArray(product.size_options) && product.size_options.length > 0) {
    return product.size_options.filter(
      (o): o is ProductSizeOption => typeof o?.label === 'string' && Array.isArray(o?.options)
    );
  }
  return DEFAULT_SIZE_OPTIONS;
}

function formatProductSizeDisplay(product_sizes: Record<string, string>): string {
  const parts = Object.entries(product_sizes)
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `${k}: ${v}`);
  return parts.join(', ');
}

interface OrderItem {
  product: Product;
  quantity: number;
  /** Selected size value per label, e.g. { "Shirt Size": "M", "Pants Size": "30" } */
  product_sizes: Record<string, string>;
  selectedColor: ProductColor | null;
}

// Image Preview Modal Component
function ImagePreviewModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  altText 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  imageUrl: string; 
  altText: string;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
        aria-label="Close preview"
      >
        <X className="w-6 h-6 text-white" />
      </button>
      
      {/* Image container */}
      <div 
        className="relative max-w-[90vw] max-h-[90vh] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={imageUrl}
          alt={altText}
          width={800}
          height={1000}
          className="object-contain max-h-[90vh] w-auto"
          unoptimized
        />
      </div>
    </div>
  );
}

// Color Selector Component for Order Page
function OrderColorSelector({ 
  colors, 
  selectedColor, 
  onColorSelect 
}: { 
  colors: ProductColor[]; 
  selectedColor: ProductColor | null;
  onColorSelect: (color: ProductColor) => void;
}) {
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);
  const activeColors = colors.filter(c => c.is_active).sort((a, b) => a.order - b.order);
  
  if (activeColors.length === 0) return null;

  const handlePreviewClick = (e: React.MouseEvent, color: ProductColor) => {
    e.stopPropagation();
    setPreviewImage({ url: getImageUrl(color.image)!, name: color.name });
  };

  const handleTouchStart = (color: ProductColor) => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setPreviewImage({ url: getImageUrl(color.image)!, name: color.name });
    }, 1000);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleColorClick = (color: ProductColor) => {
    // Only select color if long press wasn't triggered
    if (!longPressTriggered.current) {
      onColorSelect(color);
    }
    longPressTriggered.current = false;
  };

  return (
    <>
      <div className="mb-3">
        <label className="block text-sm font-medium text-black mb-2">
          <span className="uppercase tracking-wider">Colour:</span>{' '}
          <span className="uppercase font-normal">{selectedColor?.name || activeColors[0]?.name}</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {activeColors.map((color) => (
            <div key={color.id} className="relative group">
              <button
                type="button"
                onClick={() => handleColorClick(color)}
                onTouchStart={() => handleTouchStart(color)}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                className={`relative w-12 h-16 overflow-hidden transition-all select-none ${
                  (selectedColor?.id || activeColors[0]?.id) === color.id
                    ? 'ring-2 ring-black ring-offset-1'
                    : 'border border-gray-200 hover:border-gray-400'
                }`}
                aria-label={`Select ${color.name} color. Long press to preview.`}
              >
                <Image
                  src={getImageUrl(color.image)!}
                  alt={color.name}
                  fill
                  className="object-cover pointer-events-none"
                  unoptimized
                />
              </button>
              {/* Eye icon overlay - hidden on touch devices */}
              <button
                type="button"
                onClick={(e) => handlePreviewClick(e, color)}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-white/90 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm hidden md:flex"
                aria-label={`View ${color.name} full image`}
              >
                <Eye className="w-3 h-3 text-gray-700" />
              </button>
            </div>
          ))}
        </div>
        {/* Mobile hint */}
        <p className="text-xs text-gray-400 mt-1 md:hidden">Long press to preview image</p>
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url || ''}
        altText={previewImage?.name || ''}
      />
    </>
  );
}

function OrderPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get('productId') ? parseInt(searchParams.get('productId')!) : null;
  const colorId = searchParams.get('colorId') ? parseInt(searchParams.get('colorId')!) : null;

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{
    order: Order;
    items: OrderItem[];
    productTotal: number;
    deliveryCharge: number;
    totalPrice: number;
    district: string;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    customer_name: '',
    district: 'outside_dhaka',
    address: '',
    phone_number: '',
  });
  
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
        // Initialize with the first product and selected color from URL or first active color
        const activeColors = data.colors?.filter(c => c.is_active).sort((a, b) => a.order - b.order) || [];
        let selectedColor: ProductColor | null = null;
        
        // If colorId is provided in URL, find and use that color
        if (colorId && activeColors.length > 0) {
          selectedColor = activeColors.find(c => c.id === colorId) || null;
        }
        
        // If no color found from URL or no colorId provided, use first active color
        if (!selectedColor && activeColors.length > 0) {
          selectedColor = activeColors[0];
        }
        
        setOrderItems([{
          product: data,
          quantity: 1,
          product_sizes: {},
          selectedColor: selectedColor,
        }]);
      } catch (err) {
        setError('পণ্য পাওয়া যায়নি');
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId, colorId]);

  useEffect(() => {
    async function fetchAvailableProducts() {
      if (!showProductSelector) return;
      
      try {
        setLoadingProducts(true);
        const products = await productApi.getAll();
        // Show all products that are in stock (allow adding same product multiple times)
        const filteredProducts = products.filter(p => p.stock > 0);
        setAvailableProducts(filteredProducts);
      } catch (err) {
        // Silently handle error
      } finally {
        setLoadingProducts(false);
      }
    }
    fetchAvailableProducts();
  }, [showProductSelector]);

  // Scroll to top when success screen is shown
  useEffect(() => {
    if (success) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [success]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone_number') {
      // Only allow digits
      const phoneValue = value.replace(/\D/g, '');
      
      // Limit to 11 digits (Bangladesh phone numbers)
      const limitedValue = phoneValue.slice(0, 11);
      
      setFormData(prev => ({
        ...prev,
        phone_number: limitedValue,
      }));
      return;
    }
    
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

  const handleItemSizeChange = (index: number, label: string, value: string) => {
    setOrderItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const current = item.product_sizes[label];
      const next = current === value ? '' : value;
      return {
        ...item,
        product_sizes: { ...item.product_sizes, [label]: next },
      };
    }));
  };

  const handleAddProduct = (product: Product) => {
    const activeColors = product.colors?.filter(c => c.is_active).sort((a, b) => a.order - b.order) || [];
    setOrderItems(prev => [...prev, {
      product,
      quantity: 1,
      product_sizes: {},
      selectedColor: activeColors.length > 0 ? activeColors[0] : null,
    }]);
    setShowProductSelector(false);
  };

  const handleItemColorChange = (index: number, color: ProductColor) => {
    setOrderItems(prev => prev.map((item, i) => 
      i === index ? { ...item, selectedColor: color } : item
    ));
  };

  const handleRemoveProduct = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };
  
  // Calculate totals
  const getProductTotal = () => {
    return orderItems.reduce((sum, item) => {
      return sum + (item.product.current_price * item.quantity);
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
    
    // Validate Bangladesh phone number: must be 11 digits
    const phoneRegex = /^\d{11}$/;
    if (!phoneRegex.test(formData.phone_number)) {
      setError('মোবাইল নাম্বার ১১ সংখ্যার হতে হবে (যেমন: 01XXXXXXXXX)');
      return;
    }

    // Validate all items: each size option must have a selection
    for (const item of orderItems) {
      const sizeOpts = getSizeOptions(item.product);
      for (const opt of sizeOpts) {
        if (!(item.product_sizes[opt.label]?.trim())) {
          setError(`${item.product.name} এর জন্য ${opt.label} নির্বাচন করুন`);
          return;
        }
      }
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
      // Build place-order payload: each product includes product_sizes (label -> value) for backend
      const products: CreateOrderProductItem[] = orderItems.map(item => {
        const unitPrice = item.product.current_price;
        const itemTotal = unitPrice * item.quantity;
        const product_sizes = { ...item.product_sizes };
        Object.keys(product_sizes).forEach(k => { if (!product_sizes[k]?.trim()) delete product_sizes[k]; });
        return {
          product_id: item.product.id,
          product_name: item.product.name,
          product_sizes,
          product_color: item.selectedColor?.name || '',
          product_image: item.product.image ? getImageUrl(item.product.image) : null,
          quantity: item.quantity,
          unit_price: parseFloat(unitPrice.toFixed(2)),
          product_total: parseFloat(itemTotal.toFixed(2)),
        };
      });

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

      // Ensure CSRF cookie is set before POST (in case CsrfInitializer hadn't completed)
      await ensureCsrfCookie();

      let order: Order;
      try {
        order = await orderApi.createMultiProduct(orderData);
      } catch (firstErr: any) {
        // Retry once on 403 CSRF: fetch cookie then resend (backend may require token if csrf_exempt not deployed)
        const isCsrf403 = firstErr.response?.status === 403 && String(firstErr.response?.data?.detail || '').includes('CSRF');
        if (isCsrf403) {
          await ensureCsrfCookie();
          order = await orderApi.createMultiProduct(orderData);
        } else {
          throw firstErr;
        }
      }

      // Store completed order data for success screen
      setCompletedOrder({
        order,
        items: [...orderItems],
        productTotal: getProductTotal(),
        deliveryCharge: getDeliveryCharge(),
        totalPrice: getTotalPrice(),
        district: getDistrictForAPI(),
      });

      setSuccess(true);
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;
      const requestURL = err.config?.baseURL + err.config?.url;

      // Log full error for debugging (403 often = CSRF, wrong API URL, or proxy)
      console.error('[Order submit failed]', {
        status,
        requestURL,
        responseData: data,
        message: err.message,
      });

      let errorMessage = 'অর্ডার তৈরি করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
      if (data) {
        if (typeof data === 'string') errorMessage = data;
        else if (data.detail) errorMessage = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        else if (data.error) errorMessage = data.error;
        else if (data.message) errorMessage = data.message;
        else if (typeof data === 'object' && Object.keys(data).length > 0) errorMessage = JSON.stringify(data);
      }
      if (status === 403) {
        errorMessage += ' (403: সম্ভবত API ঠিকানা ভুল বা সার্ভার ব্লক করছে। NEXT_PUBLIC_API_URL আপনার Django ব্যাকেন্ড URL হতে হবে, dash.genzzone.com নয়।)';
      }
      setError(errorMessage);
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

  const handleDownloadPDF = () => {
    if (!completedOrder) return;

    const pdfData: OrderPDFData = {
      orderId: completedOrder.order.id,
      orderDate: completedOrder.order.created_at,
      customerName: formData.customer_name,
      phoneNumber: formData.phone_number,
      address: formData.address,
      district: completedOrder.district,
      paymentMethod: 'Cash on Delivery (COD)',
      items: completedOrder.items.map((item) => ({
        name: item.product.name,
        size: formatProductSizeDisplay(item.product_sizes),
        color: item.selectedColor?.name || '',
        quantity: item.quantity,
        unitPrice: item.product.current_price,
        total: item.product.current_price * item.quantity,
      })),
      productTotal: completedOrder.productTotal,
      deliveryCharge: completedOrder.deliveryCharge,
      totalAmount: completedOrder.totalPrice,
    };

    generateOrderPDF(pdfData);
  };

  if (success && completedOrder) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 md:py-16">
          <div className="max-w-2xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">অর্ডার সফল হয়েছে!</h1>
              <p className="text-gray-600">আপনার অর্ডারের জন্য ধন্যবাদ, {formData.customer_name}!</p>
            </div>

            {/* Order Details Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
              {/* Order ID and Date */}
              <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-4 text-white">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <p className="text-green-100 text-sm">অর্ডার আইডি</p>
                    <p className="font-bold text-lg">#{completedOrder.order.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-100 text-sm">তারিখ</p>
                    <p className="font-medium">{new Date(completedOrder.order.created_at).toLocaleDateString('bn-BD', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Customer Information */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    গ্রাহকের তথ্য
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">নাম:</span>
                      <span className="font-medium text-gray-900">{formData.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">মোবাইল:</span>
                      <span className="font-medium text-gray-900">{formData.phone_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">এলাকা:</span>
                      <span className="font-medium text-gray-900">{completedOrder.district}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">ঠিকানা:</span>
                      <span className="font-medium text-gray-900 text-right max-w-[200px]">{formData.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">পেমেন্ট:</span>
                      <span className="font-medium text-gray-900">ক্যাশ অন ডেলিভারি (COD)</span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    অর্ডার করা পণ্য
                  </h3>
                  <div className="space-y-3">
                    {completedOrder.items.map((item, index) => {
                      // Use selected color's image if available, otherwise fall back to product image
                      const imageToDisplay = item.selectedColor?.image || item.product.image;
                      return (
                      <div key={index} className="flex items-center gap-4 bg-gray-50 rounded-lg p-3">
                        {getImageUrl(imageToDisplay) ? (
                          <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                            <Image
                              src={getImageUrl(imageToDisplay)!}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.product.name}</p>
                          <p className="text-sm text-gray-600">
                            সাইজ: {formatProductSizeDisplay(item.product_sizes)}{item.selectedColor ? ` | রঙ: ${item.selectedColor.name}` : ''} | পরিমাণ: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-gray-900">
                            ৳{(item.product.current_price * item.quantity).toFixed(0)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-gray-500">
                              ৳{item.product.current_price.toFixed(0)} × {item.quantity}
                            </p>
                          )}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>

                {/* Price Summary */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>পণ্যের মোট:</span>
                      <span>৳{completedOrder.productTotal.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>ডেলিভারি চার্জ:</span>
                      <span>৳{completedOrder.deliveryCharge}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-200">
                      <span>সর্বমোট:</span>
                      <span className="text-green-600">৳{completedOrder.totalPrice.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleDownloadPDF}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-900 text-gray-900 font-medium rounded-lg hover:bg-gray-900 hover:text-white transition-colors"
              >
                <Download className="w-5 h-5" />
                রিসিট ডাউনলোড করুন
              </button>
              <button
                onClick={() => router.push('/products')}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
                আরও কেনাকাটা করুন
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm">
                আপনার অর্ডার কনফার্ম করতে আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।
              </p>
            </div>
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
                        {(() => {
                          // Use selected color's image if available, otherwise fall back to product image
                          const imageToDisplay = item.selectedColor?.image || item.product.image;
                          return getImageUrl(imageToDisplay) ? (
                            <div className="relative w-20 h-20 flex-shrink-0">
                              <Image
                                src={getImageUrl(imageToDisplay)!}
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
                          );
                        })()}
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
                              <p className="text-sm text-gray-600 capitalize mb-1">
                              {item.product.category?.parent_name 
                                ? `${item.product.category.parent_name} - ${item.product.category.name}` 
                                : item.product.category?.name || item.product.category_slug}
                            </p>
                              <div className="text-base font-normal text-black">
                                ৳{item.product.current_price.toFixed(0)}.00
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
                      
                      {/* Color Selector */}
                      {item.product.colors && item.product.colors.length > 0 && (
                        <OrderColorSelector
                          colors={item.product.colors}
                          selectedColor={item.selectedColor}
                          onColorSelect={(color) => handleItemColorChange(index, color)}
                        />
                      )}
                      
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

                      {/* Size Selector(s) - one block per size option from backend */}
                      {getSizeOptions(item.product).map((sizeOpt) => (
                        <div key={sizeOpt.label} className="mb-2">
                          <label className="block text-sm font-medium text-black mb-2">
                            {sizeOpt.label} <span className="text-red-500">*</span>
                          </label>
                          <div className="flex gap-2 flex-wrap">
                            {sizeOpt.options.map((optionValue) => (
                              <button
                                key={optionValue}
                                type="button"
                                onClick={() => handleItemSizeChange(index, sizeOpt.label, optionValue)}
                                className={`px-3 py-1 text-sm border-2 rounded transition-colors font-medium cursor-pointer ${
                                  item.product_sizes[sizeOpt.label] === optionValue
                                    ? 'bg-black text-white border-black'
                                    : 'bg-white text-black border-gray-300 hover:border-black'
                                }`}
                              >
                                {optionValue}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}

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
                    <div className="grid grid-cols-2 gap-2">
                      {availableProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleAddProduct(product)}
                          className="text-left p-2 border border-gray-200 rounded hover:border-black hover:bg-gray-50 transition-colors"
                        >
                          <div className="relative w-full aspect-square mb-2 rounded overflow-hidden bg-gray-100">
                            {getImageUrl(product.image) ? (
                              <Image
                                src={getImageUrl(product.image)!}
                                alt={product.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No Image</span>
                              </div>
                            )}
                          </div>
                          <div className="font-medium text-xs text-black line-clamp-2 leading-tight mb-1">{product.name}</div>
                          <div className="text-xs text-gray-600 font-semibold">৳{product.current_price.toFixed(0)}.00</div>
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
                    placeholder="01XXXXXXXXX"
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

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
                    {error}
                  </div>
                )}

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

