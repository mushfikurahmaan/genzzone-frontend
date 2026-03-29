'use client';

import { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  productApi,
  getImageUrl,
  orderApi,
  shippingApi,
  pricingApi,
} from '@/lib/api';
import type {
  StorefrontProductDetail,
  StorefrontProductList,
  OrderReceipt,
  ShippingZone,
  ShippingOption,
  PricingBreakdownResponse,
} from '@/types/akkho';
import {
  defaultVariantSelection,
  findVariantForSelection,
  requiresVariant,
} from '@/lib/variants';
import { ArrowLeft, Plus, X, Minus, CheckCircle, Download, ShoppingBag } from 'lucide-react';
import { generateOrderPDF, OrderPDFData } from '@/lib/generateOrderPDF';
import clsx from 'clsx';

function parsePrice(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

interface OrderLineRow {
  key: string;
  detail: StorefrontProductDetail;
  quantity: number;
  selection: Record<string, string>;
}

function selectionFromVariantParam(
  product: StorefrontProductDetail,
  variantId: string | null
): Record<string, string> {
  if (!variantId) return defaultVariantSelection(product);
  const v = product.variants?.find((x) => x.public_id === variantId);
  if (!v) return defaultVariantSelection(product);
  const sel: Record<string, string> = {};
  for (const o of v.options) sel[o.attribute_slug] = o.value_public_id;
  return sel;
}

function lineUnitPrice(line: OrderLineRow): number {
  const v = findVariantForSelection(line.detail, line.selection);
  if (v) return parsePrice(v.price);
  return parsePrice(line.detail.price);
}

function lineMaxQty(line: OrderLineRow): number {
  const v = findVariantForSelection(line.detail, line.selection);
  return v ? v.available_quantity : line.detail.available_quantity;
}

function lineOutOfStock(line: OrderLineRow): boolean {
  const v = findVariantForSelection(line.detail, line.selection);
  return (v ?? { stock_status: line.detail.stock_status }).stock_status === 'out_of_stock';
}

function lineVariantReady(line: OrderLineRow): boolean {
  if (!requiresVariant(line.detail)) return true;
  return findVariantForSelection(line.detail, line.selection) != null;
}

function variantLabel(line: OrderLineRow): string {
  const v = findVariantForSelection(line.detail, line.selection);
  if (!v?.options?.length) return '';
  return v.options.map((o) => `${o.attribute_name}: ${o.value}`).join(', ');
}

function LineVariantPickers({
  line,
  onSelectionChange,
}: {
  line: OrderLineRow;
  onSelectionChange: (s: Record<string, string>) => void;
}) {
  const matrix = line.detail.variant_matrix;
  const entries = matrix
    ? Object.values(matrix).sort((a, b) => a.slug.localeCompare(b.slug))
    : [];
  if (entries.length === 0) return null;

  return (
    <div className="mb-3 space-y-2">
      {entries.map((attr) => (
        <div key={attr.slug}>
          <p className="mb-1 text-xs font-medium text-gray-700">{attr.attribute_name}</p>
          <div className="flex flex-wrap gap-1.5">
            {attr.values.map((v) => {
              const active = line.selection[attr.slug] === v.value_public_id;
              return (
                <button
                  key={v.value_public_id}
                  type="button"
                  onClick={() =>
                    onSelectionChange({
                      ...line.selection,
                      [attr.slug]: v.value_public_id,
                    })
                  }
                  className={clsx(
                    'rounded border px-2 py-0.5 text-xs transition-colors',
                    active
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 hover:border-gray-500'
                  )}
                >
                  {v.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {requiresVariant(line.detail) && !findVariantForSelection(line.detail, line.selection) && (
        <p className="text-xs text-amber-600">সব অপশন নির্বাচন করুন</p>
      )}
    </div>
  );
}

function OrderPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productSlug = searchParams.get('product');
  const variantParam = searchParams.get('variant');

  const [lines, setLines] = useState<OrderLineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<StorefrontProductList[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [zoneId, setZoneId] = useState('');
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [methodId, setMethodId] = useState('');
  const [pricing, setPricing] = useState<PricingBreakdownResponse | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const checkoutStarted = useRef(false);

  const [completedOrder, setCompletedOrder] = useState<{
    receipt: OrderReceipt;
    lines: OrderLineRow[];
    productTotal: number;
    shippingCost: number;
    totalPrice: number;
    zoneLabel: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    address: '',
    phone_number: '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const z = await shippingApi.getZones();
        if (!cancelled) {
          setZones(z.filter((x) => x.is_active));
        }
      } catch {
        if (!cancelled) setZones([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    async function loadProduct() {
      if (!productSlug?.trim()) {
        setError('পণ্য নির্বাচন করা হয়নি');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const detail = await productApi.getByIdentifier(productSlug.trim());
        const selection = selectionFromVariantParam(detail, variantParam);
        setLines([
          {
            key: crypto.randomUUID(),
            detail,
            quantity: 1,
            selection,
          },
        ]);
        setError(null);
      } catch {
        setError('পণ্য পাওয়া যায়নি');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [productSlug, variantParam]);

  useEffect(() => {
    if (lines.length > 0 && !checkoutStarted.current) {
      checkoutStarted.current = true;
      orderApi.initiateCheckout().catch(() => {});
    }
  }, [lines.length]);

  const localSubtotal = useMemo(
    () => lines.reduce((s, l) => s + lineUnitPrice(l) * l.quantity, 0),
    [lines]
  );

  useEffect(() => {
    if (!zoneId) {
      setShippingOptions([]);
      setMethodId('');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const sub =
          pricing?.base_subtotal ?? String(localSubtotal);
        const opts = await shippingApi.getOptions(zoneId, sub);
        if (!cancelled) setShippingOptions(opts);
      } catch {
        if (!cancelled) setShippingOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [zoneId, pricing?.base_subtotal, localSubtotal]);

  useEffect(() => {
    if (shippingOptions.length === 0) {
      setMethodId('');
      return;
    }
    setMethodId((prev) =>
      shippingOptions.some((o) => o.method_public_id === prev)
        ? prev
        : (shippingOptions[0]?.method_public_id ?? '')
    );
  }, [shippingOptions]);

  const breakdownItems = useMemo(() => {
    return lines
      .filter((l) => lineVariantReady(l))
      .map((l) => {
        const v = findVariantForSelection(l.detail, l.selection);
        const item: {
          product_public_id: string;
          quantity: number;
          variant_public_id?: string;
        } = {
          product_public_id: l.detail.public_id,
          quantity: l.quantity,
        };
        if (v) item.variant_public_id = v.public_id;
        return item;
      });
  }, [lines]);

  useEffect(() => {
    if (breakdownItems.length === 0) {
      setPricing(null);
      return;
    }
    // Akkho pricing engine always quotes shipping; empty zone causes ValidationError (500 in DEBUG).
    if (!zoneId) {
      setPricing(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      (async () => {
        setPricingLoading(true);
        try {
          const body: Parameters<typeof pricingApi.breakdown>[0] = {
            items: breakdownItems,
            shipping_zone_public_id: zoneId,
          };
          if (methodId) body.shipping_method_public_id = methodId;
          const res = await pricingApi.breakdown(body);
          if (!cancelled) setPricing(res);
        } catch {
          if (!cancelled) setPricing(null);
        } finally {
          if (!cancelled) setPricingLoading(false);
        }
      })();
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [breakdownItems, zoneId, methodId]);

  const displaySubtotal = pricing
    ? parsePrice(pricing.base_subtotal)
    : localSubtotal;
  const displayShipping = pricing ? parsePrice(pricing.shipping_cost) : 0;
  const displayTotal = pricing
    ? parsePrice(pricing.final_total)
    : displaySubtotal + displayShipping;

  const selectedZone = zones.find((z) => z.zone_public_id === zoneId);

  useEffect(() => {
    async function fetchAvailable() {
      if (!showProductSelector) return;
      try {
        setLoadingProducts(true);
        const products = await productApi.getAll();
        setAvailableProducts(
          products.filter((p) => p.stock_status !== 'out_of_stock')
        );
      } catch {
        setAvailableProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    }
    fetchAvailable();
  }, [showProductSelector]);

  useEffect(() => {
    if (success) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [success]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'phone_number') {
      const digits = value.replace(/\D/g, '').slice(0, 11);
      setFormData((prev) => ({ ...prev, phone_number: digits }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateLine = (key: string, patch: Partial<OrderLineRow>) => {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l))
    );
  };

  const handleItemQuantityChange = (key: string, quantity: number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        const max = lineMaxQty(l);
        return {
          ...l,
          quantity: Math.max(1, Math.min(quantity, Math.max(1, max))),
        };
      })
    );
  };

  const handleAddProduct = async (p: StorefrontProductList) => {
    try {
      const detail = await productApi.getByIdentifier(p.slug);
      setLines((prev) => [
        ...prev,
        {
          key: crypto.randomUUID(),
          detail,
          quantity: 1,
          selection: defaultVariantSelection(detail),
        },
      ]);
      setShowProductSelector(false);
    } catch {
      setError('পণ্য যোগ করা যায়নি');
    }
  };

  const handleRemoveProduct = (key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      setError('অনুগ্রহ করে অন্তত একটি পণ্য যোগ করুন');
      return;
    }
    for (const line of lines) {
      if (!lineVariantReady(line)) {
        setError(`${line.detail.name} এর জন্য সব ভেরিয়েন্ট অপশন নির্বাচন করুন`);
        return;
      }
      if (lineOutOfStock(line)) {
        setError(`${line.detail.name} স্টকে নেই`);
        return;
      }
      if (line.quantity > lineMaxQty(line)) {
        setError(`${line.detail.name} এর জন্য স্টকে পর্যাপ্ত নেই`);
        return;
      }
    }

    if (!formData.customer_name.trim()) {
      setError('অনুগ্রহ করে আপনার নাম লিখুন');
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
    const phoneRegex = /^01\d{9}$/;
    if (!phoneRegex.test(formData.phone_number)) {
      setError('মোবাইল নাম্বার ০১ দিয়ে শুরু হয়ে ১১ সংখ্যার হতে হবে');
      return;
    }
    if (!zoneId) {
      setError('ডেলিভারি জোন নির্বাচন করুন');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const products = lines.map((l) => {
        const v = findVariantForSelection(l.detail, l.selection);
        const item: {
          product_public_id: string;
          quantity: number;
          variant_public_id?: string;
        } = {
          product_public_id: l.detail.public_id,
          quantity: l.quantity,
        };
        if (v) item.variant_public_id = v.public_id;
        return item;
      });

      const receipt = await orderApi.create({
        shipping_zone_public_id: zoneId,
        shipping_method_public_id: methodId || undefined,
        shipping_name: formData.customer_name.trim(),
        phone: formData.phone_number.trim(),
        email: formData.email.trim() || undefined,
        shipping_address: formData.address.trim(),
        district: selectedZone?.name ?? '',
        products,
      });

      const productTotal = parsePrice(receipt.subtotal);
      const shippingCost = parsePrice(receipt.shipping_cost);
      const totalPrice = parsePrice(receipt.total);

      const completedData = {
        receipt,
        lines: [...lines],
        productTotal,
        shippingCost,
        totalPrice,
        zoneLabel: selectedZone?.name ?? '',
        formData: {
          customer_name: formData.customer_name.trim(),
          phone_number: formData.phone_number.trim(),
          address: formData.address.trim(),
        },
      };

      try {
        sessionStorage.setItem(
          'genzzone_completed_order',
          JSON.stringify(completedData)
        );
      } catch {
        setCompletedOrder({
          receipt,
          lines: completedData.lines,
          productTotal,
          shippingCost,
          totalPrice,
          zoneLabel: completedData.zoneLabel,
        });
        setSuccess(true);
        return;
      }
      router.push(
        `/order/success?orderNumber=${encodeURIComponent(receipt.order_number)}`
      );
    } catch (err: unknown) {
      const ax = err as {
        response?: { status?: number; data?: Record<string, unknown> | string };
        message?: string;
      };
      const status = ax.response?.status;
      const data = ax.response?.data;
      let errorMessage =
        'অর্ডার তৈরি করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
      if (status === 429) {
        errorMessage =
          'অনেক বেশি অর্ডার চেষ্টা হয়েছে। এক ঘণ্টা পরে আবার চেষ্টা করুন।';
      } else if (data) {
        if (typeof data === 'string') errorMessage = data;
        else if (typeof data.detail === 'string') errorMessage = data.detail;
        else if (data.errors) errorMessage = JSON.stringify(data.errors);
      }
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!completedOrder) return;
    const now = new Date().toISOString();
    const pdfData: OrderPDFData = {
      orderNumber: completedOrder.receipt.order_number,
      orderDate: completedOrder.receipt.created_at ?? now,
      customerName: formData.customer_name,
      phoneNumber: formData.phone_number,
      address: formData.address,
      district: completedOrder.zoneLabel,
      paymentMethod: 'Cash on Delivery (COD)',
      items: completedOrder.lines.map((line) => ({
        name: line.detail.name,
        variantDetails: variantLabel(line),
        quantity: line.quantity,
        unitPrice: lineUnitPrice(line),
        total: lineUnitPrice(line) * line.quantity,
      })),
      productTotal: completedOrder.productTotal,
      deliveryCharge: completedOrder.shippingCost,
      totalAmount: completedOrder.totalPrice,
    };
    generateOrderPDF(pdfData);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-lg text-gray-600">লোড হচ্ছে...</div>
      </div>
    );
  }

  if (error && lines.length === 0 && !loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-lg text-red-600 mb-4">{error}</div>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mx-auto block px-6 py-2 border-2 border-black text-black hover:bg-black hover:text-white transition-colors rounded"
        >
          হোম পেজে ফিরে যান
        </button>
      </div>
    );
  }

  if (success && completedOrder) {
    const r = completedOrder.receipt;
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 md:py-16">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">অর্ডার সফল হয়েছে!</h1>
              <p className="text-gray-600">আপনার অর্ডারের জন্য ধন্যবাদ, {formData.customer_name}!</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-4 text-white">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <p className="text-green-100 text-sm">অর্ডার নম্বর</p>
                    <p className="font-bold text-lg">#{r.order_number}</p>
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
                      <span className="font-medium">{completedOrder.zoneLabel}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">ঠিকানা:</span>
                      <span className="font-medium text-right max-w-[200px]">{formData.address}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">অর্ডার করা পণ্য</h3>
                  <div className="space-y-3">
                    {completedOrder.lines.map((line) => (
                      <div key={line.key} className="flex gap-4 bg-gray-50 rounded-lg p-3">
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
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400">
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

                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>পণ্যের মোট:</span>
                    <span>৳{completedOrder.productTotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>শিপিং:</span>
                    <span>৳{completedOrder.shippingCost.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>সর্বমোট:</span>
                    <span className="text-green-600">৳{completedOrder.totalPrice.toFixed(0)}</span>
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
          </div>
        </div>
      </div>
    );
  }

  if (lines.length === 0 && !loading) return null;

  const anyOos = lines.some(lineOutOfStock);
  const anyVariantIncomplete = lines.some((l) => !lineVariantReady(l));

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-black hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-black mb-8">অর্ডার করতে নিচের তথ্যগুলি দিন</h1>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-black mb-4">Order Summary</h2>

              <div className="space-y-4 mb-4">
                {lines.map((line) => {
                  const oos = lineOutOfStock(line);
                  return (
                    <div key={line.key} className="border border-gray-200 rounded p-4">
                      <div className="flex gap-4 mb-3">
                        {getImageUrl(line.detail.image_url) ? (
                          <div className="relative w-20 h-20 flex-shrink-0">
                            <Image
                              src={getImageUrl(line.detail.image_url)!}
                              alt={line.detail.name}
                              fill
                              className="object-cover rounded"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">
                            No Image
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between gap-2">
                            <div>
                              <Link
                                href={`/products/${encodeURIComponent(line.detail.slug)}`}
                                className="font-semibold text-black hover:underline block"
                              >
                                {line.detail.name}
                              </Link>
                              <p className="text-sm text-gray-600">
                                {line.detail.category_name}
                              </p>
                              <p className="text-base font-medium text-black mt-1">
                                ৳{lineUnitPrice(line).toFixed(0)} / ইউনিট
                              </p>
                            </div>
                            {lines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveProduct(line.key)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Remove"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <LineVariantPickers
                        line={line}
                        onSelectionChange={(selection) =>
                          updateLine(line.key, { selection })
                        }
                      />

                      <div className="mb-2">
                        <label className="block text-sm font-medium mb-2">পরিমাণ</label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleItemQuantityChange(line.key, line.quantity - 1)
                            }
                            disabled={oos || line.quantity <= 1}
                            className="w-10 h-10 border-2 border-gray-300 rounded flex items-center justify-center disabled:opacity-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-16 text-center font-medium">{line.quantity}</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleItemQuantityChange(line.key, line.quantity + 1)
                            }
                            disabled={oos || line.quantity >= lineMaxQty(line)}
                            className="w-10 h-10 border-2 border-gray-300 rounded flex items-center justify-center disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          স্টক: {lineMaxQty(line)}
                        </p>
                      </div>

                      {oos && (
                        <div className="bg-red-50 border border-red-200 rounded p-2 text-red-700 text-xs">
                          স্টকে নেই
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowProductSelector(!showProductSelector)}
                  className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded hover:border-black flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  আরেকটি পণ্য যোগ করুন
                </button>
              </div>

              {showProductSelector && (
                <div className="mb-4 border-2 border-gray-200 rounded p-4 max-h-64 overflow-y-auto">
                  <div className="flex justify-between mb-3">
                    <h3 className="text-sm font-semibold">পণ্য নির্বাচন</h3>
                    <button
                      type="button"
                      onClick={() => setShowProductSelector(false)}
                      className="text-gray-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {loadingProducts ? (
                    <div className="text-center py-4 text-sm">লোড হচ্ছে...</div>
                  ) : availableProducts.length === 0 ? (
                    <div className="text-center py-4 text-sm">কোন পণ্য নেই</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {availableProducts.map((p) => (
                        <button
                          key={p.public_id}
                          type="button"
                          onClick={() => handleAddProduct(p)}
                          className="text-left p-2 border rounded hover:border-black"
                        >
                          <div className="relative w-full aspect-square mb-2 rounded overflow-hidden bg-gray-100">
                            {getImageUrl(p.image_url) ? (
                              <Image
                                src={getImageUrl(p.image_url)!}
                                alt={p.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : null}
                          </div>
                          <div className="font-medium text-xs line-clamp-2">{p.name}</div>
                          <div className="text-xs font-semibold">
                            ৳{parsePrice(p.price).toFixed(0)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="border-t pt-3 mt-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>পণ্যের মোট:</span>
                  <span>
                    ৳{displaySubtotal.toFixed(0)}
                    {pricingLoading && ' …'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>শিপিং:</span>
                  <span>৳{displayShipping.toFixed(0)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>মোট:</span>
                  <span>৳{displayTotal.toFixed(0)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-black mb-6">গ্রাহকের তথ্য</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="customer_name" className="block text-sm font-medium mb-2">
                    নাম <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="customer_name"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    ইমেইল (ঐচ্ছিক)
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium mb-2">
                    মোবাইল <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-black"
                    placeholder="01XXXXXXXXX"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium mb-2">
                    ঠিকানা <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-black resize-none"
                  />
                </div>

                <div>
                  <label htmlFor="zone" className="block text-sm font-medium mb-2">
                    শিপিং জোন <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="zone"
                    value={zoneId}
                    onChange={(e) => {
                      setZoneId(e.target.value);
                      setMethodId('');
                    }}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-black"
                  >
                    <option value="">নির্বাচন করুন</option>
                    {zones.map((z) => (
                      <option key={z.zone_public_id} value={z.zone_public_id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>

                {shippingOptions.length > 0 && (
                  <div>
                    <label htmlFor="method" className="block text-sm font-medium mb-2">
                      শিপিং মেথড
                    </label>
                    <select
                      id="method"
                      value={methodId}
                      onChange={(e) => setMethodId(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-black"
                    >
                      {shippingOptions.map((o) => (
                        <option key={o.rate_public_id} value={o.method_public_id}>
                          {o.method_name} — ৳{parsePrice(o.price).toFixed(0)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    lines.length === 0 ||
                    anyOos ||
                    anyVariantIncomplete ||
                    !zoneId
                  }
                  className={clsx(
                    'w-full py-3 px-6 rounded border-2 border-black text-base font-medium transition-colors',
                    submitting || anyOos || anyVariantIncomplete || !zoneId
                      ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                      : 'bg-white text-black hover:bg-black hover:text-white'
                  )}
                >
                  {submitting ? 'অর্ডার দেওয়া হচ্ছে...' : 'অর্ডার করুন'}
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
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16">
          <div className="text-center text-lg text-gray-600">লোড হচ্ছে...</div>
        </div>
      }
    >
      <OrderPageContent />
    </Suspense>
  );
}
