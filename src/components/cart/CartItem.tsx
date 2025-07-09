import React from 'react';
import { Trash2, Edit3 } from 'lucide-react';
import type { CartItem as CartItemType } from '../../data/mockCartData';

interface CartItemProps {
  item: CartItemType;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartItem({ item, onQuantityChange, onRemove }: CartItemProps) {
  const formatPrice = (price?: number) => {
    if (price === undefined) return 'Price unavailable';
    return `£${price.toFixed(2)}`;
  };

  const getStoreColor = (storeId: string) => {
    const colorMap: Record<string, string> = {
      tesco: 'bg-blue-50 text-blue-700 border-blue-200',
      asda: 'bg-green-50 text-green-700 border-green-200',
      morrisons: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      sainsburys: 'bg-orange-50 text-orange-700 border-orange-200',
      aldi: 'bg-blue-50 text-blue-700 border-blue-200'
    };
    return colorMap[storeId] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
          <button
            onClick={() => onRemove(item.id)}
            className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStoreColor(item.store.id)}`}>
            {item.store.name}
          </span>
          {!item.available && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
              Unavailable
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-gray-300 rounded-md">
              <button
                onClick={() => onQuantityChange(item.id, Math.max(1, item.quantity - 1))}
                className="p-1 hover:bg-gray-50 transition-colors"
              >
                <span className="w-4 h-4 flex items-center justify-center text-sm">−</span>
              </button>
              <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
                {item.quantity}
              </span>
              <button
                onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                className="p-1 hover:bg-gray-50 transition-colors"
              >
                <span className="w-4 h-4 flex items-center justify-center text-sm">+</span>
              </button>
            </div>
            <span className="text-xs text-gray-500 flex items-center">
              <Edit3 size={12} className="mr-1" />
              items
            </span>
          </div>

          <div className="text-right">
            <div className={`font-medium ${item.price ? 'text-gray-900' : 'text-gray-500'}`}>
              {formatPrice(item.price)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 