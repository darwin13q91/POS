import { jsPDF } from 'jspdf';
import type { Sale } from '../lib/database';
import { db } from '../lib/database';

export interface ReceiptConfig {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  taxNumber?: string;
  logo?: string;
  footerText: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  sku?: string;
}

export interface ReceiptData {
  receiptNumber: string;
  date: Date;
  cashier: string;
  customer?: {
    name: string;
    email?: string;
    phone?: string;
  };
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'digital';
  amountPaid?: number;
  change?: number;
}

class ReceiptService {
  private defaultConfig: ReceiptConfig = {
    businessName: 'Modern POS System',
    businessAddress: '123 Business St, City, State 12345',
    businessPhone: '+1 (555) 123-4567',
    businessEmail: 'info@modernpos.com',
    footerText: 'Thank you for your business!'
  };

  async getReceiptConfig(): Promise<ReceiptConfig> {
    try {
      const businessInfo = await db.getBusinessInfo();
      const footerText = await db.getSystemConfig('receipt_footer') || this.defaultConfig.footerText;

      if (businessInfo) {
        return {
          businessName: businessInfo.name,
          businessAddress: businessInfo.address || this.defaultConfig.businessAddress,
          businessPhone: businessInfo.phone || this.defaultConfig.businessPhone,
          businessEmail: businessInfo.email || this.defaultConfig.businessEmail,
          logo: businessInfo.logo,
          footerText
        };
      }
      
      return this.defaultConfig;
    } catch (error) {
      console.error('Error loading receipt config:', error);
      return this.defaultConfig;
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  }

  generateReceiptNumber(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const time = now.getTime().toString().slice(-6);
    return `${year}${month}${day}-${time}`;
  }

  async generateReceiptData(sale: Sale, cashierName: string = 'Staff'): Promise<ReceiptData> {
    const receiptItems: ReceiptItem[] = [];
    
    // Get product details for each item
    for (const item of sale.items) {
      const product = await db.products.get(item.productId);
      receiptItems.push({
        name: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        sku: product?.sku
      });
    }

    // Get customer info if available
    let customer;
    if (sale.customerId) {
      const customerRecord = await db.customers.get(sale.customerId);
      if (customerRecord) {
        customer = {
          name: customerRecord.name,
          email: customerRecord.email,
          phone: customerRecord.phone
        };
      }
    }

    return {
      receiptNumber: this.generateReceiptNumber(),
      date: sale.createdAt,
      cashier: cashierName,
      customer,
      items: receiptItems,
      subtotal: sale.subtotal,
      tax: sale.tax,
      discount: sale.discount,
      total: sale.total,
      paymentMethod: sale.paymentMethod
    };
  }

  async generatePDFReceipt(receiptData: ReceiptData): Promise<Blob> {
    const config = await this.getReceiptConfig();
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200] // Thermal receipt size
    });

    let yPosition = 10;
    const leftMargin = 5;

    // Business Header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(config.businessName, 40, yPosition, { align: 'center' });
    yPosition += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(config.businessAddress, 40, yPosition, { align: 'center' });
    yPosition += 4;
    doc.text(`Tel: ${config.businessPhone}`, 40, yPosition, { align: 'center' });
    yPosition += 4;
    doc.text(config.businessEmail, 40, yPosition, { align: 'center' });
    yPosition += 8;

    // Receipt Info
    doc.text('═'.repeat(30), leftMargin, yPosition);
    yPosition += 4;
    doc.text(`Receipt #: ${receiptData.receiptNumber}`, leftMargin, yPosition);
    yPosition += 4;
    doc.text(`Date: ${receiptData.date.toLocaleString()}`, leftMargin, yPosition);
    yPosition += 4;
    doc.text(`Cashier: ${receiptData.cashier}`, leftMargin, yPosition);
    yPosition += 4;

    if (receiptData.customer) {
      doc.text(`Customer: ${receiptData.customer.name}`, leftMargin, yPosition);
      yPosition += 4;
    }

    doc.text('═'.repeat(30), leftMargin, yPosition);
    yPosition += 6;

    // Items
    doc.setFont('helvetica', 'bold');
    doc.text('Item', leftMargin, yPosition);
    doc.text('Qty', 45, yPosition);
    doc.text('Price', 55, yPosition);
    doc.text('Total', 68, yPosition);
    yPosition += 4;
    doc.text('-'.repeat(30), leftMargin, yPosition);
    yPosition += 4;

    doc.setFont('helvetica', 'normal');
    for (const item of receiptData.items) {
      // Item name (truncate if too long)
      const itemName = item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name;
      doc.text(itemName, leftMargin, yPosition);
      doc.text(item.quantity.toString(), 45, yPosition);
      doc.text(this.formatCurrency(item.price), 55, yPosition);
      doc.text(this.formatCurrency(item.total), 68, yPosition);
      yPosition += 4;
      
      if (item.sku) {
        doc.setFontSize(7);
        doc.text(`SKU: ${item.sku}`, leftMargin, yPosition);
        yPosition += 3;
        doc.setFontSize(8);
      }
    }

    yPosition += 2;
    doc.text('-'.repeat(30), leftMargin, yPosition);
    yPosition += 4;

    // Totals
    doc.text('Subtotal:', leftMargin, yPosition);
    doc.text(this.formatCurrency(receiptData.subtotal), 68, yPosition);
    yPosition += 4;

    if (receiptData.discount > 0) {
      doc.text('Discount:', leftMargin, yPosition);
      doc.text(`-${this.formatCurrency(receiptData.discount)}`, 68, yPosition);
      yPosition += 4;
    }

    doc.text('Tax:', leftMargin, yPosition);
    doc.text(this.formatCurrency(receiptData.tax), 68, yPosition);
    yPosition += 4;

    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', leftMargin, yPosition);
    doc.text(this.formatCurrency(receiptData.total), 68, yPosition);
    yPosition += 6;

    // Payment Info
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment: ${receiptData.paymentMethod.toUpperCase()}`, leftMargin, yPosition);
    yPosition += 4;

    if (receiptData.amountPaid) {
      doc.text('Amount Paid:', leftMargin, yPosition);
      doc.text(this.formatCurrency(receiptData.amountPaid), 68, yPosition);
      yPosition += 4;
    }

    if (receiptData.change) {
      doc.text('Change:', leftMargin, yPosition);
      doc.text(this.formatCurrency(receiptData.change), 68, yPosition);
      yPosition += 4;
    }

    yPosition += 4;
    doc.text('═'.repeat(30), leftMargin, yPosition);
    yPosition += 4;

    // Footer
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(config.footerText, 40, yPosition, { align: 'center' });
    yPosition += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Visit us again!', 40, yPosition, { align: 'center' });

    return doc.output('blob');
  }

  async generateTextReceipt(receiptData: ReceiptData): Promise<string> {
    const config = await this.getReceiptConfig();
    const width = 40;
    const line = '='.repeat(width);
    const dash = '-'.repeat(width);

    let receipt = '';

    // Header
    receipt += this.centerText(config.businessName, width) + '\n';
    receipt += this.centerText(config.businessAddress, width) + '\n';
    receipt += this.centerText(`Tel: ${config.businessPhone}`, width) + '\n';
    receipt += this.centerText(config.businessEmail, width) + '\n';
    receipt += line + '\n';

    // Receipt Info
    receipt += `Receipt #: ${receiptData.receiptNumber}\n`;
    receipt += `Date: ${receiptData.date.toLocaleString()}\n`;
    receipt += `Cashier: ${receiptData.cashier}\n`;
    
    if (receiptData.customer) {
      receipt += `Customer: ${receiptData.customer.name}\n`;
    }
    
    receipt += line + '\n';

    // Items
    receipt += this.padText('Item', 'Qty', 'Price', 'Total', width) + '\n';
    receipt += dash + '\n';

    for (const item of receiptData.items) {
      const name = item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name;
      receipt += this.padText(
        name,
        item.quantity.toString(),
        this.formatCurrency(item.price),
        this.formatCurrency(item.total),
        width
      ) + '\n';
      
      if (item.sku) {
        receipt += `SKU: ${item.sku}\n`;
      }
    }

    receipt += dash + '\n';

    // Totals
    receipt += this.padRight(`Subtotal: ${this.formatCurrency(receiptData.subtotal)}`, width) + '\n';
    
    if (receiptData.discount > 0) {
      receipt += this.padRight(`Discount: -${this.formatCurrency(receiptData.discount)}`, width) + '\n';
    }
    
    receipt += this.padRight(`Tax: ${this.formatCurrency(receiptData.tax)}`, width) + '\n';
    receipt += this.padRight(`TOTAL: ${this.formatCurrency(receiptData.total)}`, width) + '\n';
    receipt += line + '\n';

    // Payment
    receipt += `Payment: ${receiptData.paymentMethod.toUpperCase()}\n`;
    
    if (receiptData.amountPaid) {
      receipt += this.padRight(`Amount Paid: ${this.formatCurrency(receiptData.amountPaid)}`, width) + '\n';
    }
    
    if (receiptData.change) {
      receipt += this.padRight(`Change: ${this.formatCurrency(receiptData.change)}`, width) + '\n';
    }

    receipt += line + '\n';
    receipt += this.centerText(config.footerText, width) + '\n';
    receipt += this.centerText('Visit us again!', width) + '\n';

    return receipt;
  }

  private centerText(text: string, width: number): string {
    const padding = Math.max(0, width - text.length) / 2;
    return ' '.repeat(Math.floor(padding)) + text + ' '.repeat(Math.ceil(padding));
  }

  private padText(col1: string, col2: string, col3: string, col4: string, width: number): string {
    const col1Width = 15;
    const col2Width = 5;
    const col3Width = 8;
    const col4Width = width - col1Width - col2Width - col3Width;

    return (
      col1.substring(0, col1Width).padEnd(col1Width) +
      col2.substring(0, col2Width).padEnd(col2Width) +
      col3.substring(0, col3Width).padEnd(col3Width) +
      col4.substring(0, col4Width).padEnd(col4Width)
    );
  }

  private padRight(text: string, width: number): string {
    return text.padStart(width);
  }

  async printReceipt(receiptData: ReceiptData): Promise<void> {
    const textReceipt = await this.generateTextReceipt(receiptData);
    
    // For web printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px; 
                line-height: 1.2; 
                margin: 10px;
                white-space: pre-wrap;
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>${textReceipt}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  }

  async emailReceipt(receiptData: ReceiptData, email: string): Promise<boolean> {
    try {
      const pdfBlob = await this.generatePDFReceipt(receiptData);
      
      // This would require a backend service in production
      // For now, we'll download the PDF and show instructions
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${receiptData.receiptNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      alert(`Receipt generated successfully!\nPlease manually send the downloaded PDF to: ${email}`);
      return true;
    } catch (error) {
      console.error('Error generating email receipt:', error);
      return false;
    }
  }
}

export const receiptService = new ReceiptService();
