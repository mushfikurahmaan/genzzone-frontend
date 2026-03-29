'use client';

import { jsPDF } from 'jspdf';

export interface OrderPDFData {
  /** Human-readable order number from storefront receipt */
  orderNumber: string;
  orderDate: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  district: string;
  paymentMethod: string;
  items: {
    name: string;
    variantDetails: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  productTotal: number;
  deliveryCharge: number;
  totalAmount: number;
}

export function generateOrderPDF(data: OrderPDFData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  const addCenteredText = (text: string, y: number, fontSize: number = 12) => {
    doc.setFontSize(fontSize);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, y);
  };

  const addLine = (y: number) => {
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, pageWidth - 20, y);
  };

  doc.setFont('helvetica', 'bold');
  addCenteredText('GenZ Zone', yPos, 24);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  addCenteredText('Order Confirmation Receipt', yPos, 12);
  yPos += 15;

  addLine(yPos);
  yPos += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Order Information', 20, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const orderInfo = [
    ['Order #:', data.orderNumber],
    ['Order Date:', formatDate(data.orderDate)],
    ['Payment Method:', data.paymentMethod],
  ];

  orderInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 70, yPos);
    yPos += 7;
  });

  yPos += 5;
  addLine(yPos);
  yPos += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Customer Information', 20, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const customerInfo = [
    ['Name:', data.customerName],
    ['Phone:', data.phoneNumber],
    ['Shipping:', data.district],
    ['Address:', ''],
  ];

  customerInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, yPos);
    doc.setFont('helvetica', 'normal');
    if (value) {
      doc.text(value, 70, yPos);
    }
    yPos += 7;
  });

  const addressLines = doc.splitTextToSize(data.address, pageWidth - 90);
  doc.text(addressLines, 70, yPos - 7);
  yPos += (addressLines.length - 1) * 5;

  yPos += 5;
  addLine(yPos);
  yPos += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Order Items', 20, yPos);
  yPos += 10;

  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos - 5, pageWidth - 40, 8, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Item', 22, yPos);
  doc.text('Variant', 70, yPos);
  doc.text('Qty', 120, yPos);
  doc.text('Price', 138, yPos);
  doc.text('Total', 165, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  data.items.forEach((item) => {
    const maxNameWidth = 45;
    let displayName = item.name;
    if (doc.getTextWidth(displayName) > maxNameWidth) {
      while (doc.getTextWidth(displayName + '...') > maxNameWidth && displayName.length > 0) {
        displayName = displayName.slice(0, -1);
      }
      displayName += '...';
    }

    let displayVar = item.variantDetails || '-';
    const maxVarWidth = 25;
    if (doc.getTextWidth(displayVar) > maxVarWidth) {
      while (doc.getTextWidth(displayVar + '...') > maxVarWidth && displayVar.length > 0) {
        displayVar = displayVar.slice(0, -1);
      }
      displayVar += '...';
    }

    doc.text(displayName, 22, yPos);
    doc.text(displayVar, 70, yPos);
    doc.text(item.quantity.toString(), 120, yPos);
    doc.text(formatCurrency(item.unitPrice), 138, yPos);
    doc.text(formatCurrency(item.total), 165, yPos);
    yPos += 7;

    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
  });

  yPos += 5;
  addLine(yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', 115, yPos);
  doc.text(formatCurrency(data.productTotal), 160, yPos);
  yPos += 7;

  doc.text('Delivery / Shipping:', 115, yPos);
  doc.text(formatCurrency(data.deliveryCharge), 160, yPos);
  yPos += 7;

  addLine(yPos);
  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Total Amount:', 115, yPos);
  doc.text(formatCurrency(data.totalAmount), 160, yPos);
  yPos += 15;

  addLine(yPos);
  yPos += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  addCenteredText('Thank you for shopping with GenZ Zone!', yPos, 11);
  yPos += 6;
  addCenteredText('For any queries, please contact us.', yPos, 10);

  const safeFile = data.orderNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`GenZZone_Order_${safeFile}.pdf`);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number): string {
  return `BDT ${Math.round(amount).toLocaleString('en-US')}`;
}
