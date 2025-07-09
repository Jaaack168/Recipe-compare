import React from 'react';
import { Home, Search, ShoppingCart, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

export function BottomNavBar() {
  const location = useLocation();
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-soft-light border-t border-gray-200 dark:border-dark-soft-border z-40">
      <div className="flex justify-around items-center py-2 max-w-md mx-auto">
        <Link 
          to="/" 
          className={`flex flex-col items-center px-4 py-2 text-xs ${
            isActive('/') 
              ? 'text-[#6DBE45]' 
              : 'text-gray-600 dark:text-dark-soft-text-muted hover:text-gray-800 dark:hover:text-dark-soft-text'
          }`}
        >
          <Home size={20} className="mb-1" />
          <span>Home</span>
        </Link>
        
        <Link 
          to="/recipes" 
          className={`flex flex-col items-center px-4 py-2 text-xs ${
            isActive('/recipes') 
              ? 'text-[#6DBE45]' 
              : 'text-gray-600 dark:text-dark-soft-text-muted hover:text-gray-800 dark:hover:text-dark-soft-text'
          }`}
        >
          <Search size={20} className="mb-1" />
          <span>Recipes</span>
        </Link>
        
        <Link 
          to="/cart" 
          className={`relative flex flex-col items-center px-4 py-2 text-xs ${
            isActive('/cart') 
              ? 'text-[#6DBE45]' 
              : 'text-gray-600 dark:text-dark-soft-text-muted hover:text-gray-800 dark:hover:text-dark-soft-text'
          }`}
        >
          <div className="relative">
            <ShoppingCart size={20} className="mb-1" />
            {totalItems > 0 && (
              <div className="absolute -top-2 -right-2 flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold shadow-sm animate-in zoom-in-75 duration-300">
                {totalItems > 99 ? '99+' : totalItems}
              </div>
            )}
          </div>
          <span>Cart</span>
        </Link>
        
        <Link 
          to="/account" 
          className={`flex flex-col items-center px-4 py-2 text-xs ${
            isActive('/account') 
              ? 'text-[#6DBE45]' 
              : 'text-gray-600 dark:text-dark-soft-text-muted hover:text-gray-800 dark:hover:text-dark-soft-text'
          }`}
        >
          <User size={20} className="mb-1" />
          <span>Account</span>
        </Link>
      </div>
    </div>
  );
}