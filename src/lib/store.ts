import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { db } from './database';
import type { Product, Sale, SaleItem, Customer } from './database';

interface CartItem extends SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

interface POSState {
  // Cart State
  cart: CartItem[];
  cartTotal: number;
  
  // UI State
  currentView: 'pos' | 'inventory' | 'sales' | 'customers' | 'settings' | 'debug' | 'support' | 'payroll' | 'employees' | 'timetracking' | 'system';
  currentSale: Sale | null;
  isProcessingPayment: boolean;
  selectedCustomer: Customer | null;
  
  // Search and filters
  productSearchTerm: string;
  selectedCategory: string;

  // Actions
  addToCart: (product: Product, quantity?: number) => void;
  updateCartItemQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  setCurrentView: (view: POSState['currentView']) => void;
  setProductSearchTerm: (term: string) => void;
  setSelectedCategory: (category: string) => void;
  startPaymentProcess: () => void;
  completePayment: (method: 'cash' | 'card' | 'digital') => Promise<Sale>;
  cancelPayment: () => void;
  setSelectedCustomer: (customer: Customer | null) => void;
}

export const usePOSStore = create<POSState>()(
  devtools(
    (set, get) => ({
      // Initial state
      cart: [],
      cartTotal: 0,
      currentView: 'pos',
      currentSale: null,
      isProcessingPayment: false,
      selectedCustomer: null,
      productSearchTerm: '',
      selectedCategory: '',

      // Actions
      addToCart: (product: Product, quantity = 1) => {
        set((state) => {
          const existingItem = state.cart.find(item => item.productId === product.id);
          let newCart: CartItem[];
          
          if (existingItem) {
            newCart = state.cart.map(item =>
              item.productId === product.id
                ? {
                    ...item,
                    quantity: item.quantity + quantity,
                    total: (item.quantity + quantity) * item.price
                  }
                : item
            );
          } else {
            const newItem: CartItem = {
              productId: product.id!,
              productName: product.name,
              quantity,
              price: product.price,
              total: product.price * quantity
            };
            newCart = [...state.cart, newItem];
          }
          
          const cartTotal = newCart.reduce((sum, item) => sum + item.total, 0);
          
          return { cart: newCart, cartTotal };
        });
      },
      
      updateCartItemQuantity: (productId: number, quantity: number) => {
        set((state) => {
          if (quantity <= 0) {
            const newCart = state.cart.filter(item => item.productId !== productId);
            const cartTotal = newCart.reduce((sum, item) => sum + item.total, 0);
            return { cart: newCart, cartTotal };
          }
          
          const newCart = state.cart.map(item =>
            item.productId === productId
              ? { ...item, quantity, total: quantity * item.price }
              : item
          );
          
          const cartTotal = newCart.reduce((sum, item) => sum + item.total, 0);
          
          return { cart: newCart, cartTotal };
        });
      },
      
      removeFromCart: (productId: number) => {
        set((state) => {
          const newCart = state.cart.filter(item => item.productId !== productId);
          const cartTotal = newCart.reduce((sum, item) => sum + item.total, 0);
          
          return { cart: newCart, cartTotal };
        });
      },
      
      clearCart: () => {
        set({ cart: [], cartTotal: 0 });
      },
      
      setSelectedCustomer: (customer: Customer | null) => {
        set({ selectedCustomer: customer });
      },

      setCurrentView: (view: POSState['currentView']) => {
        set({ currentView: view });
      },

      setProductSearchTerm: (term: string) => {
        set({ productSearchTerm: term });
      },

      setSelectedCategory: (category: string) => {
        set({ selectedCategory: category });
      },

      startPaymentProcess: () => {
        set({ isProcessingPayment: true });
      },

      completePayment: async (method: 'cash' | 'card' | 'digital'): Promise<Sale> => {
        const state = get();
        
        if (state.cart.length === 0) {
          throw new Error('Cart is empty');
        }

        try {
          set({ isProcessingPayment: true });
          
          const subtotal = state.cartTotal;
          const taxRate = 0.08; // 8% tax
          const tax = subtotal * taxRate;
          const total = subtotal + tax;
          
          const sale: Sale = {
            items: state.cart.map(item => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              price: item.price,
              total: item.total
            })),
            subtotal,
            tax,
            discount: 0,
            total,
            paymentMethod: method,
            customerId: state.selectedCustomer?.id,
            cashierId: 'default', // In a real app, this would come from auth
            createdAt: new Date(),
            status: 'completed'
          };
          
          await db.sales.add(sale);
          
          // Update product stock
          for (const item of state.cart) {
            const product = await db.products.get(item.productId);
            if (product) {
              await db.products.update(item.productId, {
                stock: product.stock - item.quantity,
                updatedAt: new Date()
              });
            }
          }
          
          // Update customer purchase history
          if (state.selectedCustomer) {
            const customer = await db.customers.get(state.selectedCustomer.id!);
            if (customer) {
              await db.customers.update(state.selectedCustomer.id!, {
                totalPurchases: customer.totalPurchases + total,
                lastPurchase: new Date(),
                updatedAt: new Date()
              });
            }
          }

          // Clear cart and update state
          set({
            cart: [],
            cartTotal: 0,
            currentSale: null,
            isProcessingPayment: false,
            selectedCustomer: null
          });
          
          return sale; // Return the sale for receipt generation
          
        } catch (error) {
          console.error('Payment failed:', error);
          set({ isProcessingPayment: false });
          throw error;
        }
      },
      
      cancelPayment: () => {
        set({ isProcessingPayment: false });
      }
    }),
    {
      name: 'pos-store'
    }
  )
);
