import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { 
  BottomNav,
  StoreToggle,
  ShoppingModeToggle,
  CartItem,
  CartSummary,
  BreakdownModal
} from '../components/cart';
import { 
  MOCK_CART_ITEMS, 
  MOCK_STORE_BREAKDOWN,
  type CartItem as CartItemType,
  type StoreFilter,
  type ShoppingMode,
  type SortOption 
} from '../data/mockCartData';

export function Cart() {
  const [selectedStore, setSelectedStore] = useState<StoreFilter>('all');
  const [shoppingMode, setShoppingMode] = useState<ShoppingMode>('single-store');
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

  // Cart totals are now calculated within CartSummary component using PriceCalculator

  const groupedItems = cartItems.reduce((groups, item) => {
    const key = item.recipeName;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, CartItemType[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">🛒 Your Cart</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Left Column - Cart */}
          <div className="lg:col-span-2">
            {/* Store Filter */}
            <StoreToggle 
              selectedStore={selectedStore}
              onStoreChange={setSelectedStore}
            />

            {/* Shopping Mode */}
            <ShoppingModeToggle 
              mode={shoppingMode}
              onModeChange={setShoppingMode}
            />

            {/* Sorting Options */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Items</span>
                <div className="relative">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Cart Items */}
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([recipeName, items]) => (
                <div key={recipeName}>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">📝</span>
                    {recipeName}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {items.map(item => (
                      <CartItem
                        key={item.id}
                        item={item}
                        onQuantityChange={handleQuantityChange}
                        onRemove={handleRemoveItem}
                        selectedStore={selectedStore}
                        shoppingMode={shoppingMode}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {cartItems.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <span className="text-4xl">🛒</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-500">Add some items to get started!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1 mt-8 lg:mt-0">
            <CartSummary
              onBreakdownClick={() => setIsBreakdownModalOpen(true)}
              onCheckoutClick={() => console.log('Proceeding to checkout')}
              onSwitchToCheapest={() => console.log('Switching to cheapest store')}
              selectedStore={selectedStore}
              cheapestStore="tesco"
              shoppingMode={shoppingMode}
              cartItems={cartItems.map(item => ({ 
                recipeName: item.recipeName, 
                quantity: item.quantity 
              }))}
            />
          </div>
        </div>
      </div>

      {/* Breakdown Modal */}
      <BreakdownModal
        isOpen={isBreakdownModalOpen}
        onClose={() => setIsBreakdownModalOpen(false)}
        storeBreakdowns={MOCK_STORE_BREAKDOWN}
        cheapestStore="Tesco"
        savings={8.00}
        comparedTo="Aldi"
      />

      {/* Bottom Navigation */}
      <BottomNav activeTab="cart" />

      {/* Mobile padding for bottom nav */}
      <div className="h-20 md:hidden" />
    </div>
  );
} 