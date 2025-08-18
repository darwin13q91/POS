import React from 'react';
import ProductGrid from '../components/ProductGrid';
import Cart from '../components/Cart';

const POSView: React.FC = () => {
  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
        <p className="text-gray-600">Select products and manage transactions</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProductGrid />
        </div>
        
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Cart />
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSView;
