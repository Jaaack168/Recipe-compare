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
      aldi: 'bg-blue-50 text-blue-700 border-blue-200',
      waitrose: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'marks-spencer': 'bg-purple-50 text-purple-700 border-purple-200'
    };
    return colorMap[storeId] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  // Mock ingredients data for demonstration
  const getIngredients = (recipeName: string) => {
    const ingredientsMap: Record<string, string[]> = {
      'Greek Yogurt Protein Bowl': [
        '200g Greek yogurt (0% fat) - Tesco £1.20, Asda £1.15, Waitrose £1.45, M&S £1.60',
        '1 scoop vanilla protein powder - Tesco £8.50, Asda £8.20, Waitrose £12.00, M&S £11.50',
        '2 tbsp granola - Tesco £2.10, Asda £1.95, Waitrose £3.20, M&S £2.95',
        '100g mixed berries - Tesco £2.50, Asda £2.30, Waitrose £3.80, M&S £3.50',
        '1 tbsp almond butter - Tesco £3.20, Asda £3.00, Waitrose £4.50, M&S £4.25',
        '1 tbsp chia seeds - Tesco £2.80, Asda £2.60, Waitrose £3.95, M&S £3.70',
        '1 tsp honey - Tesco £2.40, Asda £2.20, Waitrose £4.80, M&S £4.50',
        '2 tbsp crushed almonds - Tesco £3.50, Asda £3.20, Waitrose £5.20, M&S £4.95'
      ],
      'Turkey Meatballs & Veg': [
        '500g lean ground turkey - Tesco £5.50, Asda £5.20, Waitrose £8.50, M&S £8.00',
        '1 egg - Tesco £2.50, Asda £2.30, Waitrose £3.80, M&S £3.50',
        '1/4 cup breadcrumbs - Tesco £1.20, Asda £1.10, Waitrose £1.85, M&S £1.70',
        '2 cloves garlic, minced - Tesco £0.80, Asda £0.75, Waitrose £1.20, M&S £1.10',
        '1 onion, finely diced - Tesco £1.00, Asda £0.90, Waitrose £1.50, M&S £1.40',
        '200g green beans, trimmed - Tesco £1.80, Asda £1.60, Waitrose £2.80, M&S £2.50',
        '1 cup brown rice, cooked - Tesco £2.00, Asda £1.85, Waitrose £3.20, M&S £2.95',
        '2 tbsp olive oil - Tesco £3.00, Asda £2.80, Waitrose £5.50, M&S £5.00',
        '1 tsp Italian seasoning - Tesco £1.50, Asda £1.40, Waitrose £2.40, M&S £2.20',
        'Salt and pepper - Tesco £0.80, Asda £0.75, Waitrose £1.20, M&S £1.10'
      ],
      'Lentil & Sweet Potato Curry': [
        '1 cup red lentils - Tesco £1.50, Asda £1.35, Waitrose £2.40, M&S £2.20',
        '2 sweet potatoes, cubed - Tesco £1.80, Asda £1.60, Waitrose £2.80, M&S £2.50',
        '1 onion, diced - Tesco £1.00, Asda £0.90, Waitrose £1.50, M&S £1.40',
        '2 cloves garlic, minced - Tesco £0.80, Asda £0.75, Waitrose £1.20, M&S £1.10',
        '1 tbsp curry powder - Tesco £2.20, Asda £2.00, Waitrose £3.80, M&S £3.50',
        '400ml coconut milk - Tesco £1.80, Asda £1.65, Waitrose £2.95, M&S £2.70',
        '2 tbsp olive oil - Tesco £3.00, Asda £2.80, Waitrose £5.50, M&S £5.00',
        '1 tsp turmeric - Tesco £1.80, Asda £1.65, Waitrose £2.95, M&S £2.70',
        'Salt and pepper - Tesco £0.80, Asda £0.75, Waitrose £1.20, M&S £1.10',
        'Fresh cilantro - Tesco £1.20, Asda £1.10, Waitrose £1.85, M&S £1.70'
      ],
      'Cauliflower Buffalo Bites': [
        '1 head cauliflower, cut into florets - Tesco £1.50, Asda £1.35, Waitrose £2.40, M&S £2.20',
        '1/2 cup flour - Tesco £1.00, Asda £0.90, Waitrose £1.50, M&S £1.40',
        '1/2 cup water - Free from tap',
        '1 tsp garlic powder - Tesco £1.80, Asda £1.65, Waitrose £2.95, M&S £2.70',
        '1/2 cup buffalo sauce - Tesco £2.50, Asda £2.30, Waitrose £4.20, M&S £3.80',
        '2 tbsp olive oil - Tesco £3.00, Asda £2.80, Waitrose £5.50, M&S £5.00',
        'Salt and pepper - Tesco £0.80, Asda £0.75, Waitrose £1.20, M&S £1.10',
        'Green onions for garnish - Tesco £1.20, Asda £1.10, Waitrose £1.85, M&S £1.70'
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