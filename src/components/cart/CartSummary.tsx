import React from 'react';
import { ArrowRight, BarChart3, FileText } from 'lucide-react';
import { STORES } from '../../data/mockCartData';

interface CartSummaryProps {
  subtotal: number;
  delivery: number;
  total: number;
  onBreakdownClick: () => void;
  onCheckoutClick: () => void;
  onSwitchToCheapest: () => void;
  selectedStore?: string;
  cheapestStore?: string;
}

export function CartSummary({
  subtotal,
  delivery,
  total,
  onBreakdownClick,
  onCheckoutClick,
  onSwitchToCheapest,
  selectedStore,
  cheapestStore
}: CartSummaryProps) {
  // Check if we're already on the cheapest store
  const isOnCheapestStore = selectedStore === cheapestStore || selectedStore === 'all';
  
  // Get the loyalty program name for the selected store
  const getDeliveryLabel = () => {
    if (selectedStore === 'all') {
      return 'Delivery';
    }
    const store = STORES.find(s => s.id === selectedStore);
    return store?.loyaltyProgram || 'Delivery';
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">£{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{getDeliveryLabel()}</span>
          <span className="font-medium">£{delivery.toFixed(2)}</span>
        </div>
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between font-semibold text-lg text-green-600">
            <span>Your Savings</span>
            <span>£8.50</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">vs. shopping at most expensive store</p>
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