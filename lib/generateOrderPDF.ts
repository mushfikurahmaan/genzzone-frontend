'use client';

import { jsPDF } from 'jspdf';

export interface OrderPDFData {
  orderId: number;
  orderDate: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  district: string;
  paymentMethod: string;
  items: {
    name: string;
    size: string;
    color: string | null;
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

  // Helper function to add centered text
  const addCenteredText = (text: string, y: number, fontSize: number = 12) => {
    doc.setFontSize(fontSize);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, y);
  };

  // Helper function to add a horizontal line
  const addLine = (y: number) => {
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, pageWidth - 20, y);
  };

  // Header - Company Name
  doc.setFont('helvetica', 'bold');
  addCenteredText('GenZ Zone', yPos, 24);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  addCenteredText('Order Confirmation Receipt', yPos, 12);
  yPos += 15;

  addLine(yPos);
  yPos += 10;

  // Order Information Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Order Information', 20, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  const orderInfo = [
    ['Order ID:', `#${data.orderId}`],
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

  // Customer Information Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Customer Information', 20, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  const customerInfo = [
    ['Name:', data.customerName],
    ['Phone:', data.phoneNumber],
    ['District:', data.district],
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

  // Handle long address with word wrap
  const addressLines = doc.splitTextToSize(data.address, pageWidth - 90);
  doc.text(addressLines, 70, yPos - 7);
  yPos += (addressLines.length - 1) * 5;

  yPos += 5;
  addLine(yPos);
  yPos += 10;

  // Order Items Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Order Items', 20, yPos);
  yPos += 10;

  // Table Header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos - 5, pageWidth - 40, 8, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Item', 22, yPos);
  doc.text('Size', 70, yPos);
  doc.text('Color', 90, yPos);
  doc.text('Qty', 120, yPos);
  doc.text('Price', 138, yPos);
  doc.text('Total', 165, yPos);
  yPos += 8;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  data.items.forEach((item) => {
    // Truncate long product names
    const maxNameWidth = 45;
    let displayName = item.name;
    if (doc.getTextWidth(displayName) > maxNameWidth) {
      while (doc.getTextWidth(displayName + '...') > maxNameWidth && displayName.length > 0) {
        displayName = displayName.slice(0, -1);
      }
      displayName += '...';
    }

    // Truncate long color names
    const maxColorWidth = 25;
    let displayColor = item.color || '-';
    if (doc.getTextWidth(displayColor) > maxColorWidth) {
      while (doc.getTextWidth(displayColor + '...') > maxColorWidth && displayColor.length > 0) {
        displayColor = displayColor.slice(0, -1);
      }
      displayColor += '...';
    }

    doc.text(displayName, 22, yPos);
    doc.text(item.size, 70, yPos);
    doc.text(displayColor, 90, yPos);
    doc.text(item.quantity.toString(), 120, yPos);
    doc.text(formatCurrency(item.unitPrice), 138, yPos);
    doc.text(formatCurrency(item.total), 165, yPos);
    yPos += 7;

    // Check if we need a new page
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
  });

  yPos += 5;
  addLine(yPos);
  yPos += 10;

  // Price Summary Section
  doc.setFontSize(11);
  
  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', 115, yPos);
  doc.text(formatCurrency(data.productTotal), 160, yPos);
  yPos += 7;

  // Delivery Charge
  doc.text('Delivery Charge:', 115, yPos);
  doc.text(formatCurrency(data.deliveryCharge), 160, yPos);
  yPos += 7;

  // Total Amount
  addLine(yPos);
  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Total Amount:', 115, yPos);
  doc.text(formatCurrency(data.totalAmount), 160, yPos);
  yPos += 15;

  // Footer
  addLine(yPos);
  yPos += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  addCenteredText('Thank you for shopping with GenZ Zone!', yPos, 11);
  yPos += 6;
  addCenteredText('For any queries, please contact us.', yPos, 10);
  yPos += 6;
  addCenteredText('www.genzzone.com', yPos, 10);

  // Save the PDF
  doc.save(`GenZZone_Order_${data.orderId}.pdf`);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
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
