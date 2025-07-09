import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Edit2, ChevronDown, ShoppingBag, RefreshCw, Save, CheckCircle, X, Info, AlertCircle, Eye, EyeOff, TrendingUp } from 'lucide-react';
import { PostcodeChecker, usePostcode } from '../components/PostcodeChecker';
import { HeaderIcons } from '../components/HeaderIcons';
import { BottomNavBar } from '../components/BottomNavBar';
import StoreComparisonTable from '../components/StoreComparisonTable';

import { useCart, CartItem, CartIngredient } from '../contexts/CartContext';

export function CartPage() {
  const { state: cartState, removeIngredient, updateQuantity, clearCart } = useCart();
  const { postcode } = usePostcode();
  const [selectedSupermarket, setSelectedSupermarket] = useState<'all' | string>('all');
  const [showComparisonTable, setShowComparisonTable] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showQuantityEditor, setShowQuantityEditor] = useState<number | null>(null);
  const [showUnavailableItems, setShowUnavailableItems] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [showPriceComparison, setShowPriceComparison] = useState(false);

  console.log('CartPage - Current cart state:', cartState);

  // Initialize selected items when cart loads
  useEffect(() => {
    const initialSelectedItems = new Set<number>();
    cartState.items.forEach(item => {
      initialSelectedItems.add(item.ingredient.id);
    });
    setSelectedItems(initialSelectedItems);
  }, [cartState.items]);

  // Group items by recipe
  const itemsByRecipe = cartState.items.reduce((acc, item) => {
    const recipeId = item.ingredient.recipeId;
    if (!acc[recipeId]) {
      acc[recipeId] = {
        recipeTitle: item.ingredient.recipeTitle,
        items: []
      };
    }
    acc[recipeId].items.push(item);
    return acc;
  }, {} as { [recipeId: number]: { recipeTitle: string; items: CartItem[] } });

  const calculateTotal = () => {
    let total = 0;
    cartState.items.forEach(item => {
      if (selectedItems.has(item.ingredient.id)) {
        const price = parseFloat(item.ingredient.price?.replace('£', '') || '0');
        total += price * item.quantity;
      }
    });
    return total;
  };

  const getDisplayPriceAndStore = (ingredient: CartIngredient): { price: number; store: string } => {
    if (!ingredient.storeAvailability || ingredient.storeAvailability.length === 0) {
      return {
        price: parseFloat(ingredient.price?.replace('£', '') || '0'),
        store: 'Unknown'
      };
    }

    if (selectedSupermarket === 'all') {
      // Find the cheapest price
      const cheapest = ingredient.storeAvailability.reduce((min, current) => {
        const currentPrice = parseFloat(current.price.replace('£', ''));
        const minPrice = parseFloat(min.price.replace('£', ''));
        return currentPrice < minPrice ? current : min;
      });
      return {
        price: parseFloat(cheapest.price.replace('£', '')),
        store: cheapest.storeName
      };
    } else {
      const storeAvailability = ingredient.storeAvailability.find(
        store => store.storeId === selectedSupermarket
      );
      if (storeAvailability) {
        return {
          price: parseFloat(storeAvailability.price.replace('£', '')),
          store: storeAvailability.storeName
        };
      }
    }

    return {
      price: parseFloat(ingredient.price?.replace('£', '') || '0'),
      store: 'Unknown'
    };
  };

  const isItemAvailable = (ingredient: CartIngredient): boolean => {
    if (!ingredient.storeAvailability || ingredient.storeAvailability.length === 0) {
      return ingredient.available || false;
    }

    if (selectedSupermarket === 'all') {
      return ingredient.storeAvailability.some(store => store.available && store.inStock);
    } else {
      const storeAvailability = ingredient.storeAvailability.find(
        store => store.storeId === selectedSupermarket
      );
      return storeAvailability ? storeAvailability.available && storeAvailability.inStock : false;
    }
  };

  const getMissingItemsCount = (): number => {
    return cartState.items.filter(item => !isItemAvailable(item.ingredient)).length;
  };

  const handleRemoveItem = (ingredientId: number) => {
    console.log('Removing ingredient:', ingredientId);
    removeIngredient(ingredientId);
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(ingredientId);
      return newSet;
    });
    
    setToastMessage('Item removed from cart');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const toggleItemSelection = (ingredientId: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientId)) {
        newSet.delete(ingredientId);
      } else {
        newSet.add(ingredientId);
      }
      return newSet;
    });
  };

  const toggleRecipeSelection = (recipeId: number, selected: boolean) => {
    const recipeItems = itemsByRecipe[recipeId]?.items || [];
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      recipeItems.forEach(item => {
        if (selected) {
          newSet.add(item.ingredient.id);
        } else {
          newSet.delete(item.ingredient.id);
        }
      });
      return newSet;
    });
  };

  const handleUpdateQuantity = (ingredientId: number, quantity: number) => {
    console.log('Updating quantity for ingredient:', ingredientId, 'to:', quantity);
    updateQuantity(ingredientId, quantity);
    setShowQuantityEditor(null);
  };

  const handleSaveCartAsList = () => {
    try {
      const selectedCartItems = cartState.items.filter(item => 
        selectedItems.has(item.ingredient.id)
      );
      
      const shoppingList = selectedCartItems.map(item => ({
        ...item.ingredient,
        quantity: item.quantity
      }));
      
      localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
      
      setToastMessage('Cart saved as shopping list!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error saving cart as list:', error);
      setToastMessage('Error saving cart');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const getSelectedIngredientNames = (): string[] => {
    return cartState.items
      .filter(item => selectedItems.has(item.ingredient.id))
      .map(item => item.ingredient.name);
  };

  const handleTogglePriceComparison = () => {
    if (!postcode) {
      setToastMessage('Please enter your postcode first');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    
    if (selectedItems.size === 0) {
      setToastMessage('Please select some items to compare prices');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    
    setShowPriceComparison(!showPriceComparison);
  };

  const renderQuantityEditor = (item: CartItem) => {
    if (showQuantityEditor !== item.ingredient.id) return null;

    return (
      <div className="mt-2 p-2 bg-gray-50 dark:bg-dark-soft-lighter rounded-lg">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleUpdateQuantity(item.ingredient.id, Math.max(1, item.quantity - 1))}
            className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-soft-border flex items-center justify-center text-gray-600 dark:text-dark-soft-text hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            -
          </button>
          <span className="text-sm font-medium text-gray-900 dark:text-dark-soft-text w-8 text-center">
            {item.quantity}
          </span>
          <button
            onClick={() => handleUpdateQuantity(item.ingredient.id, item.quantity + 1)}
            className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-soft-border flex items-center justify-center text-gray-600 dark:text-dark-soft-text hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            +
          </button>
          <button
            onClick={() => setShowQuantityEditor(null)}
            className="text-[#6DBE45] text-sm font-medium ml-2"
          >
            Done
          </button>
        </div>
      </div>
    );
  };

  const renderEmptyCart = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <ShoppingCart size={64} className="text-gray-300 dark:text-dark-soft-border mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-soft-text mb-2">
        Your cart is empty
      </h3>
      <p className="text-gray-500 dark:text-dark-soft-text-muted mb-6">
        Add some recipes to get started with your shopping list
      </p>
      <Link
        to="/recipes"
        className="bg-[#6DBE45] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#5da13a] transition-colors"
      >
        Browse Recipes
      </Link>
    </div>
  );

  const renderSupermarketSelector = () => (
    <div className="bg-white dark:bg-dark-soft-light rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark-soft-border mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-dark-soft-text mb-2">
        Shop at:
      </label>
      <div className="relative">
        <select
          value={selectedSupermarket}
          onChange={(e) => setSelectedSupermarket(e.target.value)}
          className="w-full p-3 border border-gray-200 dark:border-dark-soft-border rounded-lg bg-white dark:bg-dark-soft-lighter text-gray-900 dark:text-dark-soft-text focus:ring-2 focus:ring-[#6DBE45] focus:border-transparent appearance-none"
        >
          <option value="all">Best Prices (Multiple Stores)</option>
          <option value="tesco">Tesco</option>
          <option value="asda">ASDA</option>
          <option value="sainsburys">Sainsbury's</option>
          <option value="morrisons">Morrisons</option>
          <option value="aldi">Aldi</option>
        </select>
        <ChevronDown size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );

  if (cartState.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-soft">
        <div className="max-w-md mx-auto">
          <HeaderIcons />
          <div className="px-4 pt-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-soft-text mb-6">
              Shopping Cart
            </h1>
            {renderEmptyCart()}
          </div>
          <BottomNavBar />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-soft">
      <div className="max-w-md mx-auto">
        <HeaderIcons />
        
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-soft-text">
              Shopping Cart ({cartState.items.length} items)
            </h1>
            <button
              onClick={clearCart}
              className="text-red-500 hover:text-red-600 p-2"
              title="Clear cart"
            >
              <Trash2 size={20} />
            </button>
          </div>

          {/* Postcode Checker */}
          <PostcodeChecker />

          {renderSupermarketSelector()}

          {/* Missing Items Warning */}
          {getMissingItemsCount() > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-4">
              <div className="flex items-start">
                <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {getMissingItemsCount()} item(s) may not be available at your selected store(s).
                  </p>
                  <button
                    onClick={() => setShowUnavailableItems(!showUnavailableItems)}
                    className="text-yellow-700 dark:text-yellow-300 text-sm font-medium mt-1 flex items-center"
                  >
                    {showUnavailableItems ? <EyeOff size={14} className="mr-1" /> : <Eye size={14} className="mr-1" />}
                    {showUnavailableItems ? 'Hide' : 'Show'} unavailable items
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cart Items by Recipe */}
          <div className="space-y-4 mb-24">
            {Object.entries(itemsByRecipe).map(([recipeId, recipeGroup]) => {
              const recipeItems = recipeGroup.items;
              const allSelected = recipeItems.every(item => selectedItems.has(item.ingredient.id));
              const someSelected = recipeItems.some(item => selectedItems.has(item.ingredient.id));

              return (
                <div key={recipeId} className="bg-white dark:bg-dark-soft-light rounded-xl shadow-sm border border-gray-100 dark:border-dark-soft-border overflow-hidden">
                  {/* Recipe Header */}
                  <div className="p-4 border-b border-gray-100 dark:border-dark-soft-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(input) => {
                            if (input) input.indeterminate = someSelected && !allSelected;
                          }}
                          onChange={(e) => toggleRecipeSelection(Number(recipeId), e.target.checked)}
                          className="rounded border-gray-300 text-[#6DBE45] focus:ring-[#6DBE45] mr-3"
                        />
                        <h3 className="font-semibold text-gray-900 dark:text-dark-soft-text">
                          {recipeGroup.recipeTitle}
                        </h3>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-dark-soft-text-muted">
                        {recipeItems.length} items
                      </span>
                    </div>
                  </div>

                  {/* Recipe Items */}
                  <div className="space-y-3 p-4">
                    {recipeItems.map((item) => {
                      const isAvailable = isItemAvailable(item.ingredient);
                      const { price, store } = getDisplayPriceAndStore(item.ingredient);

                      if (!showUnavailableItems && !isAvailable) {
                        return null;
                      }

                      return (
                        <div
                          key={item.ingredient.id}
                          className={`group relative bg-gray-50 dark:bg-dark-soft-lighter rounded-lg p-4 border transition-all duration-200 hover:shadow-md hover:border-[#6DBE45]/30 ${
                            !isAvailable 
                              ? 'opacity-60 border-gray-200 dark:border-dark-soft-border' 
                              : 'border-gray-200 dark:border-dark-soft-border hover:bg-white dark:hover:bg-dark-soft-light'
                          } ${
                            selectedItems.has(item.ingredient.id) 
                              ? 'ring-2 ring-[#6DBE45]/20 border-[#6DBE45]/50' 
                              : ''
                          }`}
                        >
                          {/* Mobile Layout (< sm) */}
                          <div className="sm:hidden space-y-3">
                            {/* Top row: checkbox, name, price */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                <input
                                  type="checkbox"
                                  checked={selectedItems.has(item.ingredient.id)}
                                  onChange={() => toggleItemSelection(item.ingredient.id)}
                                  disabled={!isAvailable}
                                  className="rounded border-gray-300 text-[#6DBE45] focus:ring-[#6DBE45] mt-1 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 dark:text-dark-soft-text text-sm leading-tight">
                                    {item.ingredient.name}
                                  </h4>
                                  <p className="text-xs text-gray-500 dark:text-dark-soft-text-muted mt-0.5">
                                    {item.ingredient.amount}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-3">
                                <p className="font-semibold text-gray-900 dark:text-dark-soft-text text-sm">
                                  £{(price * item.quantity).toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-dark-soft-text-muted">
                                  £{price.toFixed(2)} each
                                </p>
                              </div>
                            </div>

                            {/* Store/availability info */}
                            {!isAvailable ? (
                              <div className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 px-2 py-1 rounded">
                                Not available at selected store(s)
                              </div>
                            ) : selectedSupermarket === 'all' ? (
                              <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10 px-2 py-1 rounded inline-block">
                                ✓ Best price at {store}
                              </div>
                            ) : null}

                            {/* Bottom row: quantity controls and delete */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-dark-soft-border">
                              <button
                                onClick={() => setShowQuantityEditor(
                                  showQuantityEditor === item.ingredient.id ? null : item.ingredient.id
                                )}
                                className="flex items-center text-xs text-[#6DBE45] font-medium hover:text-[#5da13a] transition-colors"
                              >
                                <Edit2 size={12} className="mr-1" />
                                Qty: {item.quantity}
                              </button>
                              
                              <button
                                onClick={() => handleRemoveItem(item.ingredient.id)}
                                className="text-red-500 hover:text-red-600 p-1 hover:bg-red-50 dark:hover:bg-red-900/10 rounded transition-colors"
                                title="Remove item"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Desktop Layout (>= sm) */}
                          <div className="hidden sm:flex items-center space-x-4">
                            {/* Left: Checkbox + Item Info */}
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={selectedItems.has(item.ingredient.id)}
                                onChange={() => toggleItemSelection(item.ingredient.id)}
                                disabled={!isAvailable}
                                className="rounded border-gray-300 text-[#6DBE45] focus:ring-[#6DBE45] flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 dark:text-dark-soft-text truncate">
                                  {item.ingredient.name}
                                </h4>
                                <div className="flex items-center space-x-2 mt-0.5">
                                  <p className="text-sm text-gray-500 dark:text-dark-soft-text-muted">
                                    {item.ingredient.amount}
                                  </p>
                                  {!isAvailable ? (
                                    <span className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 px-2 py-0.5 rounded">
                                      Unavailable
                                    </span>
                                  ) : selectedSupermarket === 'all' ? (
                                    <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10 px-2 py-0.5 rounded">
                                      Best price at {store}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            {/* Center: Quantity Controls */}
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <button
                                onClick={() => setShowQuantityEditor(
                                  showQuantityEditor === item.ingredient.id ? null : item.ingredient.id
                                )}
                                className="flex items-center text-sm text-[#6DBE45] font-medium hover:text-[#5da13a] px-2 py-1 rounded hover:bg-[#6DBE45]/10 transition-colors"
                              >
                                <Edit2 size={14} className="mr-1" />
                                Qty: {item.quantity}
                              </button>
                            </div>

                            {/* Right: Price + Delete */}
                            <div className="flex items-center space-x-3 flex-shrink-0">
                              <div className="text-right">
                                <p className="font-semibold text-gray-900 dark:text-dark-soft-text">
                                  £{(price * item.quantity).toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-dark-soft-text-muted">
                                  £{price.toFixed(2)} each
                                </p>
                              </div>
                              
                              <button
                                onClick={() => handleRemoveItem(item.ingredient.id)}
                                className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                                title="Remove item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Quantity Editor (shown on both layouts) */}
                          {renderQuantityEditor(item)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Price Comparison Table */}
          {showPriceComparison && postcode && (
            <div className="mb-6">
              <StoreComparisonTable 
                ingredients={getSelectedIngredientNames()}
                postcode={postcode}
                className="mb-4"
              />
            </div>
          )}

          {/* Total and Actions */}
          <div className="fixed bottom-20 left-0 right-0 bg-white dark:bg-dark-soft-light border-t border-gray-200 dark:border-dark-soft-border p-4 shadow-lg">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-gray-900 dark:text-dark-soft-text">
                  Total: £{calculateTotal().toFixed(2)}
                </span>
                <span className="text-sm text-gray-500 dark:text-dark-soft-text-muted">
                  {selectedItems.size} items selected
                </span>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveCartAsList}
                  className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-dark-soft-border text-gray-700 dark:text-dark-soft-text py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Save size={18} className="mr-2" />
                  Save List
                </button>
                
                                                 <button
                  onClick={handleTogglePriceComparison}
                  className="flex-1 flex items-center justify-center bg-[#6DBE45] text-white py-3 rounded-xl font-medium hover:bg-[#5da13a] transition-colors"
                >
                  <TrendingUp size={18} className="mr-2" />
                  {showPriceComparison ? 'Hide Comparison' : 'Compare Prices'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <BottomNavBar />

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center">
              <CheckCircle size={16} className="mr-2" />
              {toastMessage}
            </div>
          </div>
        )}

                 {/* Store Comparison Modal - Coming Soon */}
      </div>
    </div>
  );
}