import React from 'react';
import { ArrowRight, BarChart3, ShoppingCart } from 'lucide-react';

interface CartSummaryProps {
  subtotal: number;
  delivery: number;
  total: number;
  onBreakdownClick: () => void;
  onCheckoutClick: () => void;
  onSwitchToCheapest: () => void;
}

export function CartSummary({
  subtotal,
  delivery,
  total,
  onBreakdownClick,
  onCheckoutClick,
  onSwitchToCheapest
}: CartSummaryProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">£{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Delivery</span>
          <span className="font-medium">£{delivery.toFixed(2)}</span>
        </div>
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>£{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={onSwitchToCheapest}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <ArrowRight size={16} className="mr-2" />
          Switch to Cheapest Store
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
          <ShoppingCart size={16} className="mr-2" />
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
} 