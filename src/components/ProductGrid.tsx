import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Minus } from 'lucide-react';
import { usePOSStore } from '../lib/store';
import { db, type Product, type Category } from '../lib/database';
import { formatCurrency } from '../lib/currency';
import { useForceRefreshCurrency } from '../lib/hooks/useCurrencySync';

const ProductGrid: React.FC = () => {
  // Force refresh when currency changes
  useForceRefreshCurrency();

  const {
    productSearchTerm,
    selectedCategory,
    setProductSearchTerm,
    setSelectedCategory,
    addToCart,
    cart
  } = usePOSStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [allProducts, allCategories] = await Promise.all([
        db.products.toArray(),
        db.categories.toArray()
      ]);
      setProducts(allProducts);
      setCategories(allCategories);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterProducts = useCallback(async () => {
    try {
      let query = db.products.toCollection();

      if (selectedCategory) {
        query = query.filter(product => product.category === selectedCategory);
      }

      if (productSearchTerm) {
        query = query.filter(product => {
          const nameMatch = product.name.toLowerCase().includes(productSearchTerm.toLowerCase());
          const skuMatch = product.sku.toLowerCase().includes(productSearchTerm.toLowerCase());
          const barcodeMatch = product.barcode ? product.barcode.includes(productSearchTerm) : false;
          return nameMatch || skuMatch || barcodeMatch;
        });
      }

      const filteredProducts = await query.toArray();
      setProducts(filteredProducts);
    } catch (error) {
      console.error('Failed to filter products:', error);
    }
  }, [selectedCategory, productSearchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const getCartQuantity = (productId: number) => {
    const cartItem = cart.find(item => item.productId === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search products by name, SKU, or barcode..."
            value={productSearchTerm}
            onChange={(e) => setProductSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:w-48"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            !selectedCategory
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.name)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.name
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={{
              backgroundColor: selectedCategory === category.name ? `${category.color}20` : undefined,
              color: selectedCategory === category.name ? category.color : undefined
            }}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => {
          const cartQuantity = getCartQuantity(product.id!);
          
          return (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow duration-200 relative"
              onClick={() => addToCart(product)}
            >
              <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
                <span className="text-gray-400 text-2xl font-bold">
                  {product.name.charAt(0)}
                </span>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{product.description}</p>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(product.price)}
                </span>
                <span className="text-sm text-gray-500">
                  Stock: {product.stock}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{product.sku}</span>
                {cartQuantity > 0 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product, -1);
                      }}
                      className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-medium">
                      {cartQuantity}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  <span className="text-white font-medium">Out of Stock</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
