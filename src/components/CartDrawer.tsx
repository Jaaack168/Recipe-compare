import React, { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { 
  StoreToggle,
  CartItem,
  CartSummary,
  BreakdownModal
} from './cart';
import { 
  MOCK_CART_ITEMS, 
  type CartItem as CartItemType,
  type StoreFilter,
  type SortOption 
} from '../data/mockCartData';
import { PriceCalculator } from '../utils/priceCalculator';

export function CartDrawer() {
  const { cartOpen, setCartOpen } = useCart();
  const [selectedStore, setSelectedStore] = useState<StoreFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('lowest-price');
  const [cartItems, setCartItems] = useState<CartItemType[]>(MOCK_CART_ITEMS);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);

  const sortOptions = [
    { value: 'lowest-price' as const, label: 'Lowest Price' },
    { value: 'best-savings' as const, label: 'Best Savings' },
    { value: 'by-store' as const, label: 'By Store' }
  ];

  const handleQuantityChange = (id: string, quantity: number) => {
    setCartItems(items => 
      items.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };



  const groupedItems = cartItems.reduce((groups, item) => {
    const key = item.recipeName;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, CartItemType[]>);

  if (!cartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-all duration-300 ease-in-out animate-in fade-in"
        onClick={() => setCartOpen(false)}
      />
      
      {/* Slide-out Cart Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transform transition-all duration-300 ease-in-out overflow-y-auto animate-in slide-in-from-right">
        {/* Close Button Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">🛒 Your Cart</h2>
          <button
            onClick={() => setCartOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>



        {/* Cart Content */}
        <div className="px-4 py-4 space-y-4">
          {/* Store Filter */}
          <StoreToggle 
            selectedStore={selectedStore}
            onStoreChange={setSelectedStore}
          />



          {/* Sorting Options */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Items</span>
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-1 pr-7 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Cart Items */}
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([recipeName, items]) => (
              <div key={recipeName}>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center text-sm">
                  <span className="mr-2">📝</span>
                  {recipeName}
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </h3>
                <div className="space-y-2">
                  {items.map(item => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemoveItem}
                      selectedStore={selectedStore}
                    />
                  ))}
                </div>
              </div>
            ))}

            {cartItems.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-3">
                  <span className="text-3xl">🛒</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-500 text-sm">Add some items to get started!</p>
              </div>
            )}
          </div>

          {/* Order Summary */}
          {cartItems.length > 0 && (
            <div className="mt-6">
              <CartSummary
                onBreakdownClick={() => setIsBreakdownModalOpen(true)}
                onCheckoutClick={() => console.log('Proceeding to checkout')}
                onSwitchToCheapest={() => console.log('Switching to cheapest store')}
                selectedStore={selectedStore}
                cheapestStore={(() => {
                  const breakdown = PriceCalculator.generateStoreBreakdown(cartItems.map(item => ({ 
                    recipeName: item.recipeName, 
                    quantity: item.quantity 
                  })));
                  return breakdown.reduce((cheapest, current) => 
                    current.total < cheapest.total ? current : cheapest
                  ).store.id;
                })()}
                cartItems={cartItems.map(item => ({ 
                  recipeName: item.recipeName, 
                  quantity: item.quantity 
                }))}
              />
            </div>
          )}
        </div>
      </div>

      {/* Breakdown Modal */}
      <BreakdownModal
        isOpen={isBreakdownModalOpen}
        onClose={() => setIsBreakdownModalOpen(false)}
        storeBreakdowns={PriceCalculator.generateStoreBreakdown(cartItems.map(item => ({ 
          recipeName: item.recipeName, 
          quantity: item.quantity 
        })))}
        cheapestStore={(() => {
          const breakdown = PriceCalculator.generateStoreBreakdown(cartItems.map(item => ({ 
            recipeName: item.recipeName, 
            quantity: item.quantity 
          })));
          return breakdown.reduce((cheapest, current) => 
            current.total < cheapest.total ? current : cheapest
          ).store.name;
        })()}
        savings={(() => {
          const breakdown = PriceCalculator.generateStoreBreakdown(cartItems.map(item => ({ 
            recipeName: item.recipeName, 
            quantity: item.quantity 
          })));
          const cheapestTotal = Math.min(...breakdown.map(store => store.total));
          const mostExpensiveTotal = Math.max(...breakdown.map(store => store.total));
          return mostExpensiveTotal - cheapestTotal;
        })()}
        comparedTo={(() => {
          const breakdown = PriceCalculator.generateStoreBreakdown(cartItems.map(item => ({ 
            recipeName: item.recipeName, 
            quantity: item.quantity 
          })));
          return breakdown.reduce((mostExpensive, current) => 
            current.total > mostExpensive.total ? current : mostExpensive
          ).store.name;
        })()}
      />
    </>
  );
} 