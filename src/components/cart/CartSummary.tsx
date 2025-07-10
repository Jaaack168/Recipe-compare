import React from 'react';
import { ArrowRight, BarChart3, FileText } from 'lucide-react';
import { STORES, StoreFilter } from '../../data/mockCartData';
import { PriceCalculator } from '../../utils/priceCalculator';

interface CartSummaryProps {
  onBreakdownClick: () => void;
  onCheckoutClick: () => void;
  onSwitchToCheapest: () => void;
  selectedStore: StoreFilter;
  cheapestStore?: string;
  cartItems: Array<{ recipeName: string; quantity: number }>;
}

export function CartSummary({
  onBreakdownClick,
  onCheckoutClick,
  onSwitchToCheapest,
  selectedStore,
  cheapestStore,
  cartItems
}: CartSummaryProps) {
  // Calculate subtotal (without loyalty savings)
  const subtotal = PriceCalculator.calculateTotal(cartItems, {
    selectedStore,
    shoppingMode: 'single-store',
    applyLoyalty: false
  });

  // Calculate total (with loyalty savings)
  const total = PriceCalculator.calculateTotal(cartItems, {
    selectedStore,
    shoppingMode: 'single-store',
    applyLoyalty: true
  });

  // Calculate savings vs most expensive store
  const mostExpensiveTotal = PriceCalculator.getMostExpensiveStoreTotal(cartItems);
  const savings = mostExpensiveTotal - total;
  
  // Check if we're already on the cheapest store
  const isOnCheapestStore = selectedStore === cheapestStore || selectedStore === 'all';
  
  // Get the loyalty scheme name for the selected store
  const loyaltySchemeName = PriceCalculator.getLoyaltySchemeName(selectedStore);
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
      
      <div className="space-y-3 mb-6">
        {/* Line 1: Subtotal without loyalty */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            Subtotal {loyaltySchemeName && selectedStore !== 'all' ? `(without ${loyaltySchemeName})` : ''}
          </span>
          <span className="font-medium">£{subtotal.toFixed(2)}</span>
        </div>
        
        {/* Line 2: Total with loyalty */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            Total {loyaltySchemeName && selectedStore !== 'all' ? `(with ${loyaltySchemeName})` : ''}
          </span>
          <span className="font-semibold text-lg">£{total.toFixed(2)}</span>
        </div>
        
        {/* Line 3: Your Savings (in green and bold) */}
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between font-bold text-lg text-green-600">
            <span className="flex items-center">
              Your Savings:
            </span>
            <span>£{savings.toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            vs. shopping at most expensive store
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={onSwitchToCheapest}
          disabled={isOnCheapestStore}
          className={`w-full flex items-center justify-center px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${
            isOnCheapestStore
              ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          <ArrowRight size={16} className="mr-2" />
          {isOnCheapestStore ? 'Already on Cheapest Store' : 'Switch to Cheapest Store'}
        </button>

        <button
          onClick={onBreakdownClick}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <BarChart3 size={16} className="mr-2" />
          Breakdown by Store
        </button>

        <button
          onClick={onCheckoutClick}
          className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          <FileText size={16} className="mr-2" />
          Get My Shopping List
        </button>
      </div>
    </div>
  );
} 