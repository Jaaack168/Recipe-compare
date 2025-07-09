import React, { useState } from 'react';
import { Clock, ShoppingCart, BookOpen, Heart, Info, Check, Loader2 } from 'lucide-react';
import { RecipeModal } from './RecipeModal';
import { useCart } from '../contexts/CartContext';

interface Recipe {
  id: number;
  title: string;
  image: string;
  time: string;
  price: string;
  available?: boolean;
  mealType?: string;
}

interface RecipeCardProps {
  recipe: Recipe;
  variant?: 'horizontal' | 'grid'; // Support both layouts
}

export function RecipeCard({
  recipe,
  variant = 'horizontal'
}: RecipeCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showUnavailableTooltip, setShowUnavailableTooltip] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Cart functionality
  const { addRecipe, isIngredientInCart, getIngredientQuantity } = useCart();
  
  const isAvailable = recipe.available !== false; // If available is undefined, treat as true
  // For now, we'll check if any ingredient from this recipe is in the cart
  // This is a simplified approach - in reality you might want to check specific ingredients
  const recipeInCart = isIngredientInCart(recipe.id * 1000); // Check first ingredient ID
  const itemQuantity = getIngredientQuantity(recipe.id * 1000); // Get quantity of first ingredient

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    // Here you would typically call an API to save the favorite status
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Get the image source, fallback to placeholder if missing or error
  const getImageSrc = () => {
    if (imageError || !recipe.image || recipe.image === '') {
      return '/assets/placeholder.svg';
    }
    return recipe.image;
  };

  const handleViewClick = () => {
    if (!isAvailable) {
      // Show tooltip instead of opening modal for unavailable recipes
      setShowUnavailableTooltip(true);
      setTimeout(() => setShowUnavailableTooltip(false), 2000);
      return;
    }
    setIsModalOpen(true);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAvailable || isAddingToCart) return;

    setIsAddingToCart(true);
    
    try {
      // Add a small delay for better UX (simulating async operation)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('Adding recipe to cart:', recipe);
      addRecipe(recipe);

      // Show success feedback
      setShowAddedFeedback(true);
      setTimeout(() => setShowAddedFeedback(false), 1500);
      
    } catch (error) {
      console.error('Error adding recipe to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Responsive width classes based on variant
  const cardWidthClass = variant === 'grid' 
    ? 'w-full max-w-[200px]' 
    : 'flex-shrink-0 w-[160px] sm:w-[200px]';

  const imageHeightClass = variant === 'grid' ? 'h-[140px]' : 'h-[120px]';

  // Dynamic button content based on state
  const getAddButtonContent = () => {
    if (isAddingToCart) {
      return (
        <>
          <Loader2 size={14} className="mr-1 flex-shrink-0 animate-spin" />
          <span className="truncate">Adding...</span>
        </>
      );
    }
    
    if (showAddedFeedback) {
      return (
        <>
          <Check size={14} className="mr-1 flex-shrink-0 text-green-600" />
          <span className="truncate text-green-600">Added!</span>
        </>
      );
    }
    
    if (recipeInCart && itemQuantity > 0) {
      return (
        <>
          <ShoppingCart size={14} className="mr-1 flex-shrink-0" />
          <span className="truncate">Add ({itemQuantity})</span>
        </>
      );
    }
    
    return (
      <>
        <ShoppingCart size={14} className="mr-1 flex-shrink-0" />
        <span className="truncate">Add</span>
      </>
    );
  };

  // Dynamic button styling
  const getAddButtonStyles = () => {
    if (!isAvailable) {
      return 'bg-gray-100 dark:bg-dark-soft-lighter text-gray-400 dark:text-dark-soft-text-muted cursor-not-allowed';
    }
    
    if (showAddedFeedback) {
      return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800';
    }
    
    if (recipeInCart) {
      return 'bg-[#6DBE45]/20 hover:bg-[#6DBE45]/30 dark:bg-[#6DBE45]/30 dark:hover:bg-[#6DBE45]/40 text-[#6DBE45] ring-1 ring-[#6DBE45]/30';
    }
    
    return 'bg-[#6DBE45]/10 hover:bg-[#6DBE45]/20 dark:bg-[#6DBE45]/20 dark:hover:bg-[#6DBE45]/30 text-[#6DBE45]';
  };

  return (
    <>
      <div className={`${cardWidthClass} rounded-xl overflow-hidden bg-white dark:bg-dark-soft-light shadow-sm border border-gray-100 dark:border-dark-soft-border ${!isAvailable ? 'opacity-75' : ''}`}>
        <div className={`relative ${imageHeightClass}`}>
          <img 
            src={getImageSrc()} 
            alt={recipe.title} 
            onError={handleImageError}
            className={`w-full h-full object-cover ${!isAvailable ? 'grayscale' : ''}`} 
          />
          
          {/* Favorite button */}
          <div className="absolute top-2 right-2">
            <div className="relative" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
              <button 
                onClick={toggleFavorite} 
                className={`flex items-center justify-center h-8 w-8 rounded-full bg-white/80 dark:bg-dark-soft-light/90 backdrop-blur-sm shadow-sm transition-colors ${
                  isFavorited 
                    ? 'text-[#6DBE45]' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-dark-soft-text-muted dark:hover:text-dark-soft-text'
                }`} 
                aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart size={16} fill={isFavorited ? '#6DBE45' : 'none'} />
              </button>
              {showTooltip && (
                <div className="absolute right-0 top-full mt-1 z-10 px-2 py-1 text-xs font-medium text-white bg-gray-800 dark:bg-dark-soft-lighter rounded-md shadow-sm whitespace-nowrap">
                  {isFavorited ? 'Remove from Favourites' : 'Add to Favourites'}
                  <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-800 dark:bg-dark-soft-lighter transform rotate-45"></div>
                </div>
              )}
            </div>
          </div>

          {/* Meal type tag */}
          {recipe.mealType && (
            <div className="absolute bottom-2 left-2">
              <span className="inline-block bg-white/90 dark:bg-dark-soft-light/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full text-gray-700 dark:text-dark-soft-text border border-white/20 dark:border-dark-soft-border/20">
                {recipe.mealType}
              </span>
            </div>
          )}

          {/* Cart quantity indicator */}
          {recipeInCart && itemQuantity > 0 && !showAddedFeedback && (
            <div className="absolute top-2 left-2">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-[#6DBE45] text-white text-xs font-bold shadow-sm animate-in zoom-in-75 duration-200">
                {itemQuantity}
              </div>
            </div>
          )}

          {/* Unavailable overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                Unavailable
              </span>
            </div>
          )}
        </div>

        <div className="p-3">
          <h3 className="font-semibold text-gray-900 dark:text-dark-soft-text text-sm mb-2 line-clamp-2 leading-tight">
            {recipe.title}
          </h3>
          
          <div className="flex items-center text-xs text-gray-500 dark:text-dark-soft-text-muted mb-3">
            <Clock size={12} className="mr-1 flex-shrink-0" />
            <span className="truncate">{recipe.time}</span>
            <span className="mx-1">•</span>
            <span className="font-medium text-gray-700 dark:text-dark-soft-text truncate">{recipe.price}</span>
          </div>

          <div className="flex gap-2">
            {/* Add to Cart Button */}
            <div className="relative flex-1">
              <button 
                onClick={handleAddToCart}
                disabled={!isAvailable || isAddingToCart}
                onMouseEnter={() => !isAvailable && setShowUnavailableTooltip(true)}
                onMouseLeave={() => setShowUnavailableTooltip(false)}
                className={`w-full flex items-center justify-center text-xs font-medium py-2 px-2 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${getAddButtonStyles()} ${
                  isAddingToCart ? 'cursor-wait' : ''
                }`}
                aria-label={`${recipeInCart ? `Add another ${recipe.title} to cart (currently ${itemQuantity})` : `Add ${recipe.title} to cart`}`}
              >
                {getAddButtonContent()}
              </button>
              
              {/* Unavailable tooltip */}
              {showUnavailableTooltip && !isAvailable && (
                <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 z-20 px-2 py-1 text-xs font-medium text-white bg-gray-800 dark:bg-dark-soft-lighter rounded-md shadow-sm whitespace-nowrap">
                  <Info size={10} className="inline mr-1" />
                  Not available in your area
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 dark:bg-dark-soft-lighter rotate-45"></div>
                </div>
              )}
            </div>

            {/* View Button */}
            <button 
              onClick={handleViewClick}
              className={`flex-1 flex items-center justify-center text-xs font-medium py-2 px-2 rounded-lg transition-colors border ${
                isAvailable
                  ? 'border-[#6DBE45] text-[#6DBE45] bg-white hover:bg-[#6DBE45]/5 dark:bg-dark-soft-lighter dark:hover:bg-[#6DBE45]/10'
                  : 'border-gray-300 dark:border-dark-soft-border text-gray-400 dark:text-dark-soft-text-muted bg-gray-50 dark:bg-dark-soft-lighter cursor-not-allowed'
              }`}
            >
              <BookOpen size={14} className="mr-1 flex-shrink-0" />
              <span className="truncate">View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recipe Modal - only open for available recipes */}
      {isAvailable && (
        <RecipeModal 
          recipe={recipe} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          isFavorited={isFavorited} 
          onFavoriteToggle={() => toggleFavorite({} as React.MouseEvent)} 
        />
      )}
    </>
  );
}