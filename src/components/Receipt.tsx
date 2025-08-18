import React from 'react';
import { type Sale, type Product } from '../lib/database';

interface ReceiptProps {
  sale: Sale;
  products: Product[];
  onClose: () => void;
  onPrint: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({ sale, products, onClose, onPrint }) => {
  const getProductName = (productId: number) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  const subtotal = sale.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax rate
  const total = subtotal + tax;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-auto">
        <div id="receipt-content" className="receipt-print">
          {/* Receipt Header */}
          <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
            <h2 className="text-xl font-bold text-gray-900">Modern POS</h2>
            <p className="text-sm text-gray-600">Your Local Store</p>
            <p className="text-sm text-gray-600">123 Main Street, City</p>
            <p className="text-sm text-gray-600">Phone: (555) 123-4567</p>
          </div>

          {/* Transaction Info */}
          <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Date:</span>
              <span className="text-sm font-medium">
                {new Date(sale.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Time:</span>
              <span className="text-sm font-medium">
                {new Date(sale.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Receipt #:</span>
              <span className="text-sm font-medium">{sale.id?.toString().padStart(6, '0')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Payment:</span>
              <span className="text-sm font-medium capitalize">{sale.paymentMethod}</span>
            </div>
          </div>

          {/* Items */}
          <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Items</h3>
            {sale.items.map((item, index) => (
              <div key={index} className="mb-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {getProductName(item.productId)}
                    </p>
                    <p className="text-xs text-gray-600">
                      ${item.price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-b border-dashed border-gray-300 pb-4 mb-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Subtotal:</span>
              <span className="text-sm font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tax (8%):</span>
              <span className="text-sm font-medium">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600">
            <p>Thank you for your business!</p>
            <p className="mt-2">Visit us again soon</p>
            <p className="mt-2">
              Return Policy: Items can be returned within 30 days with receipt
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6 no-print">
          <button
            onClick={onPrint}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .receipt-print,
            .receipt-print * {
              visibility: visible;
            }
            .receipt-print {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `
      }} />
    </div>
  );
};

export default Receipt;
