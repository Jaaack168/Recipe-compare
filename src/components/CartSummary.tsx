import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowRight, Star, Clock, AlertCircle } from 'lucide-react';
import { usePostcode } from './PostcodeChecker';
import { CartCalculation, CartItem } from '../types';
import { mockApiServices } from '../services/mockApiServices';

export function CartSummary() {
  const { nearbyStores, postcodeInfo } = usePostcode();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [calculations, setCalculations] = useState<CartCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Load cart items from localStorage
  useEffect(() => {
    const loadCartItems = () => {
      try {
        const savedCart = localStorage.getItem('cartItems');
        if (savedCart) {
          setCartItems(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    };

    loadCartItems();
    
    // Listen for cart changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cartItems') {
        loadCartItems();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Calculate costs when cart items or stores change
  useEffect(() => {
    if (cartItems.length > 0 && nearbyStores.length > 0) {
      calculateCosts();
    }
  }, [cartItems, nearbyStores]);

  const calculateCosts = async () => {
    setIsLoading(true);
    try {
      const results = await mockApiServices.calculateCartTotals(cartItems, nearbyStores);
      setCalculations(results);
    } catch (error) {
      console.error('Error calculating costs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedItems = cartItems.filter(item => item.selected);
  const totalItems = selectedItems.length;
  
  if (totalItems === 0) {
    return (
      <div className="bg-white dark:bg-dark-soft-light rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark-soft-border">
        <div className="flex items-center justify-center text-gray-500 dark:text-dark-soft-text-muted py-4">
          <ShoppingBag size={18} className="mr-2" />
          Your cart is empty
        </div>
      </div>
    );
  }

  const bestOption = calculations.find(calc => calc.isCheapestAvailable);
  const cheapestOverall = calculations.length > 0 ? calculations[0] : null;

  return (
    <div className="bg-white dark:bg-dark-soft-light rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark-soft-border">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-dark-soft-text flex items-center">
          <ShoppingBag size={18} className="mr-2 text-[#6DBE45]" />
          Cart Summary
        </h2>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-700 dark:text-dark-soft-text">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </div>
          {postcodeInfo && (
            <div className="text-xs text-gray-500 dark:text-dark-soft-text-muted">
              {postcodeInfo.area}
            </div>
          )}
        </div>
      </div>

      {/* Best option display */}
      {bestOption && (
        <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Star size={16} className="text-green-600 dark:text-green-400 mr-2" />
              <div>
                <div className="font-medium text-green-800 dark:text-green-300">
                  {bestOption.storeName}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  Best option - All items available
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-green-800 dark:text-green-300">
                £{bestOption.totalCost.toFixed(2)}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                {nearbyStores.find(s => s.id === bestOption.storeId)?.distance.toFixed(1)} mi
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cheapest overall if different from best */}
      {cheapestOverall && !cheapestOverall.isCheapestAvailable && (
        <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-400 mr-2" />
              <div>
                <div className="font-medium text-yellow-800 dark:text-yellow-300">
                  {cheapestOverall.storeName}
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">
                  Cheapest but {cheapestOverall.missingItems} {cheapestOverall.missingItems === 1 ? 'item' : 'items'} missing
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-yellow-800 dark:text-yellow-300">
                £{cheapestOverall.totalCost.toFixed(2)}
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400">
                {nearbyStores.find(s => s.id === cheapestOverall.storeId)?.distance.toFixed(1)} mi
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No valid options */}
      {calculations.length === 0 && !isLoading && postcodeInfo && (
        <div className="mb-3 p-3 bg-gray-50 dark:bg-dark-soft-lighter rounded-lg border border-gray-200 dark:border-dark-soft-border">
          <div className="flex items-center">
            <Clock size={16} className="text-gray-500 dark:text-dark-soft-text-muted mr-2" />
            <div className="text-sm text-gray-600 dark:text-dark-soft-text-muted">
              Enter postcode to see store options
            </div>
          </div>
        </div>
      )}

      {/* Compare button */}
      <button
        onClick={() => setShowComparison(!showComparison)}
        disabled={isLoading || calculations.length === 0}
        className="w-full flex items-center justify-center bg-[#f9f7f2] dark:bg-dark-soft-lighter hover:bg-[#f0ede3] dark:hover:bg-dark-soft-hover text-gray-700 dark:text-dark-soft-text py-2.5 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Clock size={16} className="mr-2 animate-spin" />
            Calculating...
          </>
        ) : (
          <>
            Compare Across {nearbyStores.length} Stores
            <ArrowRight size={16} className="ml-1" />
          </>
        )}
      </button>

      {/* Store comparison dropdown */}
      {showComparison && calculations.length > 0 && (
        <div className="mt-3 space-y-2">
          {calculations.map((calc) => {
            const store = nearbyStores.find(s => s.id === calc.storeId);
            return (
              <div
                key={calc.storeId}
                className={`p-3 rounded-lg border ${
                  calc.isCheapestAvailable
                    ? 'border-green-200 bg-green-50 dark:border-green-800/30 dark:bg-green-900/10'
                    : calc.isFullyAvailable
                    ? 'border-blue-200 bg-blue-50 dark:border-blue-800/30 dark:bg-blue-900/10'
                    : 'border-gray-200 bg-gray-50 dark:border-dark-soft-border dark:bg-dark-soft-lighter'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-800 dark:text-dark-soft-text">
                        {calc.storeName}
                        {calc.isCheapestAvailable && (
                          <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded">
                            Best
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-dark-soft-text-muted">
                        {store?.distance.toFixed(1)} mi • {calc.availableItems}/{totalItems} items
                      </div>
                      {calc.missingItems > 0 && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Missing: {calc.missingItemNames.slice(0, 2).join(', ')}
                          {calc.missingItemNames.length > 2 && ` +${calc.missingItemNames.length - 2} more`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-gray-800 dark:text-dark-soft-text">
                      £{calc.totalCost.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-dark-soft-text-muted">
                      {store?.isOpen ? 'Open' : 'Closed'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}