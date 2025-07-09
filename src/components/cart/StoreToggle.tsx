import React from 'react';
import { STORES } from '../../data/mockCartData';
import type { StoreFilter } from '../../data/mockCartData';

interface StoreToggleProps {
  selectedStore: StoreFilter;
  onStoreChange: (store: StoreFilter) => void;
}

export function StoreToggle({ selectedStore, onStoreChange }: StoreToggleProps) {
  const allStores = [
    { id: 'all' as const, name: 'All Stores', logo: '🏪' },
    ...STORES.map(store => ({ id: store.id as StoreFilter, name: store.name, logo: store.logo }))
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {allStores.map((store) => {
        const isSelected = selectedStore === store.id;
        
        return (
          <button
            key={store.id}
            onClick={() => onStoreChange(store.id)}
            className={`flex items-center px-3 py-2 rounded-full text-sm font-medium transition-all ${
              isSelected
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {store.logo && (
              <span className="mr-2">{store.logo}</span>
            )}
            {store.name}
          </button>
        );
      })}
    </div>
  );
} 