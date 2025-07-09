import React from 'react';
import { Brain, Store } from 'lucide-react';
import type { ShoppingMode } from '../../data/mockCartData';

interface ShoppingModeProps {
  mode: ShoppingMode;
  onModeChange: (mode: ShoppingMode) => void;
}

export function ShoppingModeToggle({ mode, onModeChange }: ShoppingModeProps) {
  const modes = [
    {
      id: 'smart-cart' as const,
      label: 'Smart Cart',
      icon: Brain,
      description: 'Showing the best single store for your entire basket',
      disabled: true
    },
    {
      id: 'single-store' as const,
      label: 'Single Store',
      icon: Store,
      description: 'Shop from one store',
      disabled: false
    }
  ];

  return (
    <div className="mb-6">
      <div className="text-sm font-medium text-gray-700 mb-2">Shopping Mode</div>
      <div className="bg-gray-100 rounded-lg p-1 flex">
        {modes.map((modeOption) => {
          const isSelected = mode === modeOption.id;
          const Icon = modeOption.icon;
          
          return (
            <button
              key={modeOption.id}
              onClick={() => !modeOption.disabled && onModeChange(modeOption.id)}
              disabled={modeOption.disabled}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-gray-800 text-white shadow-sm'
                  : modeOption.disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} className="mr-2" />
              {modeOption.label}
            </button>
          );
        })}
      </div>
      {mode === 'smart-cart' && (
        <div className="mt-2 text-xs text-gray-500 flex items-center">
          <Brain size={12} className="mr-1" />
          Showing the best single store for your entire basket
        </div>
      )}
    </div>
  );
} 