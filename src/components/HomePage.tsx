import React, { useState, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { PostcodeChecker, usePostcode } from './PostcodeChecker';
import { RecipeSection } from './RecipeSection';
import { CartSummary } from './CartSummary';
import { BottomNavBar } from './BottomNavBar';
import { HeaderIcons } from './HeaderIcons';
import { ApiStatusBanner } from './ApiStatusBanner';
import { 
  fetchSuggestedRecipes, 
  fetchTrendingRecipes, 
  fetchQuickEasyRecipes, 
  fetchHighProteinRecipes, 
  Recipe,
  getNoRecipesMessage
} from '../utils/staticApi';
import { mockApiServices } from '../services/mockApiServices';
import { FilterCategory } from './FilterChips';
import { 
  StoreToggle,
  ShoppingModeToggle,
  CartItem,
  CartSummary as NewCartSummary,
  BreakdownModal
} from './cart';
import { 
  MOCK_CART_ITEMS, 
  MOCK_STORE_BREAKDOWN,
  type CartItem as CartItemType,
  type StoreFilter,
  type ShoppingMode,
  type SortOption 
} from '../data/mockCartData';

export function HomePage() {
  const { postcode, postcodeInfo, nearbyStores } = usePostcode();
  const [personalizedSuggestions, setPersonalizedSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Static recipe data - loaded directly from JSON
  const [suggestedRecipes, setSuggestedRecipes] = useState<Recipe[]>([]);
  const [trendingRecipes, setTrendingRecipes] = useState<Recipe[]>([]);
  const [quickEasyRecipes, setQuickEasyRecipes] = useState<Recipe[]>([]);
  const [highProteinRecipes, setHighProteinRecipes] = useState<Recipe[]>([]);
  
  // Availability filtering status
  const [filteredMessages, setFilteredMessages] = useState<{[key: string]: string}>({});
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);

  // Cart state management
  const [cartPostcode, setCartPostcode] = useState('');
  const [selectedStore, setSelectedStore] = useState<StoreFilter>('all');
  const [shoppingMode, setShoppingMode] = useState<ShoppingMode>('single-store');
  const [sortOption, setSortOption] = useState<SortOption>('lowest-price');
  const [cartItems, setCartItems] = useState<CartItemType[]>(MOCK_CART_ITEMS);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);

  // Cart helper functions
  const sortOptions = [
    { value: 'lowest-price' as const, label: 'Lowest Price' },
    { value: 'best-savings' as const, label: 'Best Savings' },
    { value: 'by-store' as const, label: 'By Store' }
  ];

  const handleQuantityChange = (id: string, quantity: number) => {
    setCartItems(items => 
      items.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const handleCheckPostcode = () => {
    console.log('Checking postcode:', cartPostcode);
    // Postcode validation logic would go here
  };

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => 
      sum + (item.price || 0) * item.quantity, 0
    );
    const delivery = 4.99; // Default delivery fee
    const total = subtotal + delivery;
    
    return { subtotal, delivery, total };
  };

  const groupedItems = cartItems.reduce((groups, item) => {
    const key = item.recipeName;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, CartItemType[]>);

  // Load personalized suggestions when postcode changes
  useEffect(() => {
    const loadSuggestions = async () => {
      if (postcode) {
        setIsLoadingSuggestions(true);
        try {
          const suggestions = await mockApiServices.getRecipeSuggestions(postcode);
          setPersonalizedSuggestions(suggestions);
        } catch (error) {
          console.error('Error loading personalized suggestions:', error);
        } finally {
          setIsLoadingSuggestions(false);
        }
      }
    };

    loadSuggestions();
  }, [postcode]);

  // Load all recipes once on component mount and when postcode/stores change
  useEffect(() => {
    const loadAllRecipes = async () => {
      setIsLoadingRecipes(true);
      try {
        // Determine if we should check availability based on postcode/stores
        const checkAvailability = Boolean(postcode && nearbyStores && nearbyStores.length > 0);
        const availabilityOptions = {
          checkAvailability,
          availabilityThreshold: 0.7, // Require 70% of ingredients to be available
        };

        const [suggested, trending, quickEasy, highProtein] = await Promise.all([
          fetchSuggestedRecipes(5, availabilityOptions),
          fetchTrendingRecipes(5, availabilityOptions),
          fetchQuickEasyRecipes(5, availabilityOptions),
          fetchHighProteinRecipes(5, availabilityOptions)
        ]);

        setSuggestedRecipes(suggested.recipes);
        setTrendingRecipes(trending.recipes);
        setQuickEasyRecipes(quickEasy.recipes);
        setHighProteinRecipes(highProtein.recipes);

        // Set filtered messages if recipes were filtered out
        const messages: {[key: string]: string} = {};
        if (checkAvailability) {
          if (suggested.filteredOut && suggested.filteredOut > 0) {
            messages.suggested = getNoRecipesMessage(suggested.filteredOut, 5 + suggested.filteredOut);
          }
          if (trending.filteredOut && trending.filteredOut > 0) {
            messages.trending = getNoRecipesMessage(trending.filteredOut, 5 + trending.filteredOut);
          }
          if (quickEasy.filteredOut && quickEasy.filteredOut > 0) {
            messages.quickEasy = getNoRecipesMessage(quickEasy.filteredOut, 5 + quickEasy.filteredOut);
          }
          if (highProtein.filteredOut && highProtein.filteredOut > 0) {
            messages.highProtein = getNoRecipesMessage(highProtein.filteredOut, 5 + highProtein.filteredOut);
          }
        }
        setFilteredMessages(messages);

      } catch (error) {
        console.error('Error loading recipes:', error);
      } finally {
        setIsLoadingRecipes(false);
      }
    };

    loadAllRecipes();
  }, [postcode, nearbyStores]);

  // Component for rendering sections
  const renderSection = (title: string, recipes: Recipe[], emoji: string, filterTag?: FilterCategory, sectionKey?: string) => {
    // Generate the view all link with filter tag
    const viewAllLink = filterTag ? `/recipes?filter=${encodeURIComponent(filterTag)}` : '/recipes';
    
    // Check if we have a filtered message for this section
    const filteredMessage = sectionKey ? filteredMessages[sectionKey] : undefined;

    return (
      <div className="mb-8">
        <RecipeSection 
          title={`${emoji} ${title}`}
          recipes={recipes}
          viewAllLink={viewAllLink}
        />
        {/* Show filtered message if recipes were filtered out */}
        {filteredMessage && (
          <div className="mt-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 px-3 py-2 rounded-lg">
            ℹ️ {filteredMessage}
          </div>
        )}
        {/* Show fallback message if no recipes available */}
        {!isLoadingRecipes && recipes.length === 0 && (
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/10 px-3 py-2 rounded-lg text-center">
            {postcode ? 
              "No recipes available right now — try adjusting your filters or checking back later." :
              "Enter your postcode to see personalized recipe availability."
            }
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f9f7f2] dark:bg-dark-soft w-full">
      <header className="w-full bg-[#f9f7f2] dark:bg-dark-soft border-b border-gray-200/30 dark:border-dark-soft-border/30 py-4 sticky top-0 z-20 shadow-sm">
        <div className="px-4 max-w-screen-xl mx-auto w-full flex justify-between items-center">
          <PostcodeChecker />
          <HeaderIcons />
        </div>
      </header>
      <main className="flex-1 px-4 pt-6 pb-20 max-w-screen-xl mx-auto w-full">
        {/* Cart Section */}
        <div className="mb-6">
          {/* Cart Header with Delivery Location */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Location
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={cartPostcode}
                    onChange={(e) => setCartPostcode(e.target.value)}
                    placeholder="Enter postcode"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleCheckPostcode}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Check
                </button>
              </div>
            </div>
          </div>

          {/* Main Cart Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            {/* Cart Header */}
            <div className="flex items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">🛒 Your Cart</h2>
            </div>

            {/* Store Filter */}
            <StoreToggle 
              selectedStore={selectedStore}
              onStoreChange={setSelectedStore}
            />

            {/* Shopping Mode */}
            <ShoppingModeToggle 
              mode={shoppingMode}
              onModeChange={setShoppingMode}
            />

            {/* Sorting Options */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Items</span>
                <div className="relative">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Cart Items */}
            <div className="space-y-6 mb-6">
              {Object.entries(groupedItems).map(([recipeName, items]) => (
                <div key={recipeName}>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">📝</span>
                    {recipeName}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {items.map(item => (
                      <CartItem
                        key={item.id}
                        item={item}
                        onQuantityChange={handleQuantityChange}
                        onRemove={handleRemoveItem}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {cartItems.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <span className="text-4xl">🛒</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-500">Add some items to get started!</p>
                </div>
              )}
            </div>

            {/* Order Summary */}
            {cartItems.length > 0 && (
              <NewCartSummary
                subtotal={calculateTotals().subtotal}
                delivery={calculateTotals().delivery}
                total={calculateTotals().total}
                onBreakdownClick={() => setIsBreakdownModalOpen(true)}
                onCheckoutClick={() => console.log('Proceeding to checkout')}
                onSwitchToCheapest={() => console.log('Switching to cheapest store')}
              />
            )}
          </div>
        </div>
        
        {/* API Status Banner */}
        <ApiStatusBanner />
        
        {/* Render recipe sections */}
        <div className="space-y-8">
          {renderSection("Suggested Recipes", suggestedRecipes, "✨", "Vegetarian", "suggested")}
          {renderSection("Trending Recipes", trendingRecipes, "🔥", undefined, "trending")}
          {renderSection("Quick & Easy", quickEasyRecipes, "⏱", "Quick Meals", "quickEasy")}
          {renderSection("High Protein", highProteinRecipes, "💪", "High Protein", "highProtein")}
        </div>
      </main>
      <BottomNavBar />
      
      {/* Breakdown Modal */}
      <BreakdownModal
        isOpen={isBreakdownModalOpen}
        onClose={() => setIsBreakdownModalOpen(false)}
        storeBreakdowns={MOCK_STORE_BREAKDOWN}
        cheapestStore={MOCK_STORE_BREAKDOWN.reduce((cheapest, current) => 
          current.total < cheapest.total ? current : cheapest
        ).store.name}
        savings={15.50}
        comparedTo="Sainsbury's"
      />
    </div>
  );
}