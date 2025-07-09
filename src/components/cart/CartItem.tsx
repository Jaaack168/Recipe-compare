import React, { useState } from 'react';
import { Trash2, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import type { CartItem as CartItemType } from '../../data/mockCartData';

interface CartItemProps {
  item: CartItemType;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartItem({ item, onQuantityChange, onRemove }: CartItemProps) {
  const [showIngredients, setShowIngredients] = useState(false);

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

  // Mock ingredients data for demonstration
  const getIngredients = (recipeName: string) => {
    const ingredientsMap: Record<string, string[]> = {
      'Greek Yogurt Protein Bowl': [
        '200g Greek yogurt (0% fat)',
        '1 scoop vanilla protein powder',
        '2 tbsp granola',
        '100g mixed berries',
        '1 tbsp almond butter',
        '1 tbsp chia seeds',
        '1 tsp honey',
        '2 tbsp crushed almonds'
      ],
      'Turkey Meatballs & Veg': [
        '500g lean ground turkey',
        '1 egg',
        '1/4 cup breadcrumbs',
        '2 cloves garlic, minced',
        '1 onion, finely diced',
        '200g green beans, trimmed',
        '1 cup brown rice, cooked',
        '2 tbsp olive oil',
        '1 tsp Italian seasoning',
        'Salt and pepper'
      ],
      'Lentil & Sweet Potato Curry': [
        '1 cup red lentils',
        '2 sweet potatoes, cubed',
        '1 onion, diced',
        '2 cloves garlic, minced',
        '1 tbsp curry powder',
        '400ml coconut milk',
        '2 tbsp olive oil',
        '1 tsp turmeric',
        'Salt and pepper',
        'Fresh cilantro'
      ],
      'Cauliflower Buffalo Bites': [
        '1 head cauliflower, cut into florets',
        '1/2 cup flour',
        '1/2 cup water',
        '1 tsp garlic powder',
        '1/2 cup buffalo sauce',
        '2 tbsp olive oil',
        'Salt and pepper',
        'Green onions for garnish'
      ]
    };
    return ingredientsMap[recipeName] || ['Ingredients not available'];
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
            <button
              onClick={() => setShowIngredients(!showIngredients)}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors"
            >
              Ingredients
              {showIngredients ? (
                <ChevronUp size={12} className="ml-1" />
              ) : (
                <ChevronDown size={12} className="ml-1" />
              )}
            </button>
          )}
        </div>

        {/* Ingredients Dropdown */}
        {!item.available && showIngredients && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
            <h5 className="text-xs font-semibold text-gray-700 mb-2">Recipe Ingredients:</h5>
            <ul className="text-xs text-gray-600 space-y-1">
              {getIngredients(item.recipeName).map((ingredient, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-1 h-1 bg-gray-400 rounded-full mr-2 flex-shrink-0"></span>
                  {ingredient}
                </li>
              ))}
            </ul>
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                {item.price ? `Price: £${item.price.toFixed(2)}` : 'No price data available'}
              </p>
            </div>
          </div>
        )}

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