import React from 'react';
import { Book, ShoppingCart, CreditCard } from 'lucide-react';

interface BottomNavProps {
  activeTab?: 'recipes' | 'cart' | 'checkout';
}

export function BottomNav({ activeTab = 'cart' }: BottomNavProps) {
  const tabs = [
    {
      id: 'recipes' as const,
      label: 'Recipes',
      icon: Book,
      emoji: '📖'
    },
    {
      id: 'cart' as const,
      label: 'Cart',
      icon: ShoppingCart,
      emoji: '🛒'
    },
    {
      id: 'checkout' as const,
      label: 'Checkout',
      icon: CreditCard,
      emoji: '💳'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 md:hidden">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              className={`flex flex-col items-center px-4 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'text-green-600 bg-green-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center w-6 h-6 mb-1">
                <span className="text-lg">{tab.emoji}</span>
              </div>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
} 