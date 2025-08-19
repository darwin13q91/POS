import React, { useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { usePOSStore } from '../lib/store';
import { db, type Sale, type Product } from '../lib/database';
import { formatCurrency } from '../lib/currency';
import Receipt from './Receipt';

const Cart: React.FC = () => {
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  
  const {
    cart,
    cartTotal,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    startPaymentProcess,
    completePayment,
    cancelPayment,
    isProcessingPayment
  } = usePOSStore();

  const subtotal = cartTotal;
  const taxRate = 0.08; // 8% tax
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const handlePayment = async (method: 'cash' | 'card' | 'digital') => {
    try {
      const sale = await completePayment(method);
      if (sale) {
        setLastSale(sale);
        // Load products for receipt
        const allProducts = await db.products.toArray();
        setProducts(allProducts);
        setShowReceipt(true);
      }
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (cart.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <ShoppingCart className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Cart</h2>
        </div>
        <div className="text-center py-8">
          <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Your cart is empty</p>
          <p className="text-sm text-gray-400 mt-1">Add products to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <ShoppingCart className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Cart ({cart.length})</h2>
        </div>
        <button
          onClick={clearCart}
          className="text-red-600 hover:text-red-700 p-1"
          title="Clear cart"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
        {cart.map((item) => (
          <div
            key={item.productId}
            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
          >
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-600 font-bold">
                {item.productName.charAt(0)}
              </span>
            </div>
            
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{item.productName}</h3>
              <p className="text-sm text-gray-600">{formatCurrency(item.price)} each</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateCartItemQuantity(item.productId, item.quantity - 1)}
                className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-8 text-center font-medium">{item.quantity}</span>
              <button
                onClick={() => updateCartItemQuantity(item.productId, item.quantity + 1)}
                className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            
            <div className="text-right">
              <p className="font-semibold text-gray-900">{formatCurrency(item.total)}</p>
              <button
                onClick={() => removeFromCart(item.productId)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax (8%):</span>
          <span className="font-medium">{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>Total:</span>
          <span className="text-blue-600">{formatCurrency(total)}</span>
        </div>
      </div>

      {!isProcessingPayment ? (
        <div className="mt-6 space-y-3">
          <button
            onClick={startPaymentProcess}
            className="w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 text-lg"
          >
            Proceed to Payment
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <p className="text-center text-gray-600 font-medium mb-4">Select Payment Method</p>
          
          <button
            onClick={() => handlePayment('cash')}
            className="w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 flex items-center justify-center space-x-2"
          >
            <Banknote className="h-5 w-5" />
            <span>Cash</span>
          </button>
          
          <button
            onClick={() => handlePayment('card')}
            className="w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 flex items-center justify-center space-x-2"
          >
            <CreditCard className="h-5 w-5" />
            <span>Card</span>
          </button>
          
          <button
            onClick={() => handlePayment('digital')}
            className="w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 flex items-center justify-center space-x-2"
          >
            <Smartphone className="h-5 w-5" />
            <span>Digital Wallet</span>
          </button>
          
          <button
            onClick={cancelPayment}
            className="w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 text-sm"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <Receipt
          sale={lastSale}
          products={products}
          onClose={() => {
            setShowReceipt(false);
            setLastSale(null);
          }}
          onPrint={handlePrintReceipt}
        />
      )}
    </div>
  );
};

export default Cart;
