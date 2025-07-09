import React from 'react';
import { X, TrendingDown, CreditCard } from 'lucide-react';
import type { StoreBreakdown } from '../../data/mockCartData';

interface BreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeBreakdowns: StoreBreakdown[];
  cheapestStore: string;
  savings?: number;
  comparedTo?: string;
}

export function BreakdownModal({
  isOpen,
  onClose,
  storeBreakdowns,
  cheapestStore,
  savings,
  comparedTo
}: BreakdownModalProps) {
  if (!isOpen) return null;

  const getLoyaltyIcon = (loyaltyProgram?: string) => {
    if (!loyaltyProgram) return null;
    return <CreditCard size={12} className="ml-1" />;
  };

  const getStoreColor = (storeId: string) => {
    const colorMap: Record<string, string> = {
      tesco: 'border-blue-200 bg-blue-50',
      asda: 'border-green-200 bg-green-50',
      morrisons: 'border-yellow-200 bg-yellow-50',
      sainsburys: 'border-orange-200 bg-orange-50',
      aldi: 'border-blue-200 bg-blue-50'
    };
    return colorMap[storeId] || 'border-gray-200 bg-gray-50';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Price Breakdown by Store</h2>
            <p className="text-sm text-gray-600 mt-1">
              {cheapestStore} would be cheapest for your current selection.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Savings Banner */}
        {savings && comparedTo && (
          <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <TrendingDown size={16} className="text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">
                Potential savings: £{savings.toFixed(2)} compared to {comparedTo}
              </span>
            </div>
          </div>
        )}

        {/* Store List */}
        <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
          {storeBreakdowns.map((breakdown) => {
            const isCheapest = breakdown.store.name === cheapestStore;
            
            return (
              <div
                key={breakdown.store.id}
                className={`border rounded-lg p-4 transition-all ${
                  isCheapest 
                    ? 'border-green-500 bg-green-50 ring-1 ring-green-500' 
                    : getStoreColor(breakdown.store.id)
                }`}
              >
                {isCheapest && (
                  <div className="mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                      Best Price
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900">{breakdown.store.name}</span>
                    {breakdown.store.loyaltyProgram && (
                      <span className="ml-2 inline-flex items-center text-xs text-gray-600">
                        {getLoyaltyIcon(breakdown.store.loyaltyProgram)}
                        <span className="ml-1">{breakdown.store.loyaltyProgram}</span>
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">£{breakdown.total.toFixed(2)}</div>
                  </div>
                </div>

                <div className="text-sm">
                  <div className="flex justify-between">
                    <div className="text-gray-600">Subtotal</div>
                    <div className="font-medium">£{breakdown.subtotal.toFixed(2)}</div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Items</span>
                    <span>{breakdown.itemsAvailable} items</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 