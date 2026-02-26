'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Product, ProductColor, getImageUrl } from '@/lib/api';
import { CheckCircle, Download, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { generateOrderPDF, OrderPDFData } from '@/lib/generateOrderPDF';
import type { Order } from '@/lib/api';

function formatProductSizeDisplay(product_sizes: Record<string, string>): string {
  const parts = Object.entries(product_sizes)
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `${k}: ${v}`);
  return parts.join(', ');
}

interface OrderItem {
  product: Product;
  quantity: number;
  product_sizes: Record<string, string>;
  selectedColor: ProductColor | null;
}

interface StoredCompletedOrder {
  order: Order;
  items: OrderItem[];
  productTotal: number;
  deliveryCharge: number;
  totalPrice: number;
  district: string;
  formData: {
    customer_name: string;
    phone_number: string;
    address: string;
  };
}

const STORAGE_KEY = 'genzzone_completed_order';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const [data, setData] = useState<StoredCompletedOrder | null>(null);
  const [notFound, setNotFound] = useState(false);
  const loadedRef = useRef(false);
  const purchaseTrackedRef = useRef(false);

  useEffect(() => {
    if (!orderId) {
      setNotFound(true);
      return;
    }
    if (loadedRef.current) return;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setNotFound(true);
        return;
      }
      const parsed = JSON.parse(stored) as StoredCompletedOrder;
      if (String(parsed.order?.id) !== orderId) {
        setNotFound(true);
        return;
      }
      loadedRef.current = true;
      setData(parsed);
      sessionStorage.removeItem(STORAGE_KEY);

      if (!purchaseTrackedRef.current && typeof window !== 'undefined' && window.fbq) {
        purchaseTrackedRef.current = true;
        const contentIds = parsed.items.map((i: OrderItem) => String(i.product.id));
        const numItems = parsed.items.reduce((sum: number, i: OrderItem) => sum + i.quantity, 0);
        window.fbq('track', 'Purchase', {
          value: parseFloat(Number(parsed.totalPrice).toFixed(2)),
          currency: 'BDT',
          order_id: String(parsed.order.id),
          content_ids: contentIds,
          content_type: 'product',
          num_items: numItems,
        }, { eventID: `order_${parsed.order.id}` });
      }
    } catch {
      setNotFound(true);
    }
  }, [orderId]);

  const handleDownloadPDF = () => {
    if (!data) return;

    const pdfData: OrderPDFData = {
      orderId: data.order.id,
      orderDate: data.order.created_at,
      customerName: data.formData.customer_name,
      phoneNumber: data.formData.phone_number,
      address: data.formData.address,
      district: data.district,
      paymentMethod: 'Cash on Delivery (COD)',
      items: data.items.map((item) => ({
        name: item.product.name,
        size: formatProductSizeDisplay(item.product_sizes),
        color: item.selectedColor?.name ?? null,
        quantity: item.quantity,
        unitPrice: item.product.current_price,
        total: item.product.current_price * item.quantity,
      })),
      productTotal: data.productTotal,
      deliveryCharge: data.deliveryCharge,
      totalAmount: data.totalPrice,
    };

    generateOrderPDF(pdfData);
  };

  if (notFound) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">অর্ডার খুঁজে পাওয়া যায়নি</h1>
          <p className="text-gray-600 mb-6">
            এই পৃষ্ঠাটি শুধুমাত্র সফল অর্ডারের পর প্রদর্শিত হয়। আপনার অর্ডার নিশ্চিত করতে অর্ডার পেজে যান।
          </p>
          <button
            onClick={() => router.push('/order')}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            অর্ডার পেজে যান
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center text-lg text-gray-600">লোড হচ্ছে...</div>
      </div>
    );
  }

  const { order, items, productTotal, deliveryCharge, totalPrice, district, formData } = data;

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
            <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-4 text-white">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <p className="text-green-100 text-sm">অর্ডার আইডি</p>
                  <p className="font-bold text-lg">#{order.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-100 text-sm">তারিখ</p>
                  <p className="font-medium">
                    {new Date(order.created_at).toLocaleDateString('bn-BD', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
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
                    <span className="font-medium text-gray-900">{district}</span>
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
                  {items.map((item, index) => {
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
                            সাইজ: {formatProductSizeDisplay(item.product_sizes)}
                            {item.selectedColor ? ` | রঙ: ${item.selectedColor.name}` : ''} | পরিমাণ: {item.quantity}
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
                    <span>৳{productTotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>ডেলিভারি চার্জ:</span>
                    <span>৳{deliveryCharge}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-200">
                    <span>সর্বমোট:</span>
                    <span className="text-green-600">৳{totalPrice.toFixed(0)}</span>
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
