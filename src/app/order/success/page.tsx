'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import { getImageUrl } from '@/lib/api';
import type { OrderReceipt, StorefrontProductDetail } from '@/types/akkho';
import { findVariantForSelection } from '@/lib/variants';
import { CheckCircle, Download, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { generateOrderPDF, OrderPDFData } from '@/lib/generateOrderPDF';

function parsePrice(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function lineUnitPrice(line: {
  detail: StorefrontProductDetail;
  selection: Record<string, string>;
}): number {
  const v = findVariantForSelection(line.detail, line.selection);
  if (v) return parsePrice(v.price);
  return parsePrice(line.detail.price);
}

function variantLabel(line: {
  detail: StorefrontProductDetail;
  selection: Record<string, string>;
}): string {
  const v = findVariantForSelection(line.detail, line.selection);
  if (!v?.options?.length) return '';
  return v.options.map((o) => `${o.attribute_name}: ${o.value}`).join(', ');
}

interface StoredLine {
  key: string;
  detail: StorefrontProductDetail;
  quantity: number;
  selection: Record<string, string>;
}

interface StoredCompletedOrder {
  receipt: OrderReceipt;
  lines: StoredLine[];
  productTotal: number;
  shippingCost: number;
  totalPrice: number;
  zoneLabel: string;
  formData: {
    customer_name: string;
    phone_number: string;
    address: string;
  };
}

const STORAGE_KEY = 'genzzone_completed_order';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get('orderNumber');
  const [data, setData] = useState<StoredCompletedOrder | null>(null);
  const [notFound, setNotFound] = useState(false);
  const loadedRef = useRef(false);
  const purchaseTrackedRef = useRef(false);

  useEffect(() => {
    if (!orderNumber) {
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
      if (parsed.receipt?.order_number !== orderNumber) {
        setNotFound(true);
        return;
      }
      loadedRef.current = true;
      setData(parsed);
      sessionStorage.removeItem(STORAGE_KEY);

      if (
        !purchaseTrackedRef.current &&
        typeof window !== 'undefined' &&
        window.fbq
      ) {
        purchaseTrackedRef.current = true;
        const contentIds = parsed.lines.map((l) => l.detail.public_id);
        const numItems = parsed.lines.reduce((s, l) => s + l.quantity, 0);
        window.fbq(
          'track',
          'Purchase',
          {
            value: parseFloat(Number(parsed.totalPrice).toFixed(2)),
            currency: 'BDT',
            order_id: parsed.receipt.order_number,
            content_ids: contentIds,
            content_type: 'product',
            num_items: numItems,
          },
          { eventID: `order_${parsed.receipt.public_id}` }
        );
      }
    } catch {
      setNotFound(true);
    }
  }, [orderNumber]);

  const handleDownloadPDF = () => {
    if (!data) return;
    const now = new Date().toISOString();
    const pdfData: OrderPDFData = {
      orderNumber: data.receipt.order_number,
      orderDate: data.receipt.created_at ?? now,
      customerName: data.formData.customer_name,
      phoneNumber: data.formData.phone_number,
      address: data.formData.address,
      district: data.zoneLabel,
      paymentMethod: 'Cash on Delivery (COD)',
      items: data.lines.map((line) => ({
        name: line.detail.name,
        variantDetails: variantLabel(line),
        quantity: line.quantity,
        unitPrice: lineUnitPrice(line),
        total: lineUnitPrice(line) * line.quantity,
      })),
      productTotal: data.productTotal,
      deliveryCharge: data.shippingCost,
      totalAmount: data.totalPrice,
    };
    generateOrderPDF(pdfData);
  };

  if (notFound) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            অর্ডার খুঁজে পাওয়া যায়নি
          </h1>
          <p className="text-gray-600 mb-6">
            এই পৃষ্ঠাটি শুধুমাত্র সফল অর্ডারের পর প্রদর্শিত হয়।
          </p>
          <button
            type="button"
            onClick={() => router.push('/products')}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            পণ্য দেখুন
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

  const { receipt, lines, productTotal, shippingCost, totalPrice, zoneLabel, formData } =
    data;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              অর্ডার সফল হয়েছে!
            </h1>
            <p className="text-gray-600">
              আপনার অর্ডারের জন্য ধন্যবাদ, {formData.customer_name}!
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-4 text-white">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <p className="text-green-100 text-sm">অর্ডার নম্বর</p>
                  <p className="font-bold text-lg">#{receipt.order_number}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">গ্রাহকের তথ্য</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">নাম:</span>
                    <span className="font-medium">{formData.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">মোবাইল:</span>
                    <span className="font-medium">{formData.phone_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">জোন:</span>
                    <span className="font-medium">{zoneLabel}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">ঠিকানা:</span>
                    <span className="font-medium text-right max-w-[200px]">
                      {formData.address}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">অর্ডার করা পণ্য</h3>
                <div className="space-y-3">
                  {lines.map((line) => (
                    <div
                      key={line.key}
                      className="flex items-center gap-4 bg-gray-50 rounded-lg p-3"
                    >
                      {getImageUrl(line.detail.image_url) ? (
                        <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                          <Image
                            src={getImageUrl(line.detail.image_url)!}
                            alt={line.detail.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 text-xs text-gray-400">
                          No Image
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{line.detail.name}</p>
                        <p className="text-sm text-gray-600">
                          {variantLabel(line)} | পরিমাণ: {line.quantity}
                        </p>
                      </div>
                      <div className="text-right font-semibold">
                        ৳{(lineUnitPrice(line) * line.quantity).toFixed(0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>পণ্যের মোট:</span>
                  <span>৳{productTotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>শিপিং:</span>
                  <span>৳{shippingCost.toFixed(0)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>সর্বমোট:</span>
                  <span className="text-green-600">৳{totalPrice.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-900 font-medium rounded-lg hover:bg-gray-900 hover:text-white transition-colors"
            >
              <Download className="w-5 h-5" />
              রিসিট ডাউনলোড করুন
            </button>
            <button
              type="button"
              onClick={() => router.push('/products')}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              আরও কেনাকাটা করুন
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              আপনার অর্ডার কনফার্ম করতে আমরা শীঘ্রই যোগাযোগ করব।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="text-center text-lg text-gray-600">লোড হচ্ছে...</div>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
