import React, { useState } from 'react';
import { Trash2, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import type { CartItem as CartItemType, StoreFilter, ShoppingMode } from '../../data/mockCartData';
import { PriceCalculator } from '../../utils/priceCalculator';

interface CartItemProps {
  item: CartItemType;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  selectedStore: StoreFilter;
  shoppingMode: ShoppingMode;
}

export function CartItem({ item, onQuantityChange, onRemove, selectedStore, shoppingMode }: CartItemProps) {
  const [showIngredients, setShowIngredients] = useState(false);

  const formatPrice = () => {
    // Calculate price using the recipe name and cart settings
    const calculatedPrice = PriceCalculator.calculateRecipePrice(item.recipeName, {
      selectedStore,
      shoppingMode,
      quantity: item.quantity
    });
    
    if (calculatedPrice === 0) {
      return 'Price unavailable';
    }
    
    return `£${calculatedPrice.toFixed(2)}`;
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

  // Simplified ingredients list without pricing data
  const getIngredients = (recipeName: string) => {
    const ingredientsMap: Record<string, string[]> = {
      'Greek Yogurt Protein Bowl': [
        'Greek yogurt (0% fat)',
        'Vanilla protein powder',
        'Granola',
        'Mixed berries',
        'Almond butter',
        'Chia seeds',
        'Honey',
        'Crushed almonds'
      ],
      'Turkey Meatballs & Veg': [
        'Lean ground turkey',
        'Egg',
        'Breadcrumbs',
        'Garlic, minced',
        'Onion, finely diced',
        'Green beans, trimmed',
        'Brown rice',
        'Olive oil',
        'Italian seasoning',
        'Salt and pepper'
      ],
      'Lentil & Sweet Potato Curry': [
        'Red lentils',
        'Sweet potatoes, cubed',
        'Onion, diced',
        'Garlic, minced',
        'Curry powder',
        'Coconut milk',
        'Olive oil',
        'Turmeric',
        'Salt and pepper',
        'Fresh cilantro'
      ],
      'Cauliflower Buffalo Bites': [
        'Cauliflower, cut into florets',
        'Flour',
        'Water',
        'Garlic powder',
        'Buffalo sauce',
        'Olive oil',
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
          {selectedStore !== 'all' && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStoreColor(selectedStore)}`}>
              {selectedStore === 'tesco' && 'Tesco'}
              {selectedStore === 'asda' && 'Asda'}
              {selectedStore === 'morrisons' && 'Morrisons'}
              {selectedStore === 'sainsburys' && "Sainsbury's"}
              {selectedStore === 'aldi' && 'Aldi'}
              {selectedStore === 'waitrose' && 'Waitrose'}
              {selectedStore === 'marks-spencer' && 'M&S'}
            </span>
          )}
          {selectedStore === 'all' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200">
              Smart Cart
            </span>
          )}
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
                Recipe total: {formatPrice()}
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
            <div className="font-medium text-gray-900">
              {formatPrice()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 