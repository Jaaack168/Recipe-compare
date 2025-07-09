import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Clock, X, Heart, Users, DollarSign, ShoppingCart, ChefHat, Check, ChevronRight, ChevronLeft, Star, Timer, Save, Mic, Maximize, ArrowLeft } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useToast } from './Toast';

interface RecipeIngredient {
  id: number;
  name: string;
  amount: string;
}

interface RecipeStep {
  id: number;
  instruction: string;
  hasTimer?: boolean;
  timerMinutes?: number;
}

interface Recipe {
  id: number;
  title: string;
  image: string;
  time: string;
  price: string;
  servings?: string;
  available?: boolean;
  ingredients?: string[] | RecipeIngredient[]; // Allow both formats
  steps?: RecipeStep[];
  rating?: number;
  nutrition?: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
    fiber: string;
  };
}

interface RecipeModalProps {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
  isFavorited: boolean;
  onFavoriteToggle: () => void;
}

export function RecipeModal({
  recipe,
  isOpen,
  onClose,
  isFavorited,
  onFavoriteToggle
}: RecipeModalProps) {
  const [selectedIngredients, setSelectedIngredients] = useState<number[]>([]);
  const [cookingMode, setCookingMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [runningTimers, setRunningTimers] = useState<{
    [key: number]: boolean;
  }>({});
  const [timerCountdowns, setTimerCountdowns] = useState<{
    [key: number]: number;
  }>({});
  const [imageError, setImageError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  
  // Get cart functionality and toast
  const { addRecipe } = useCart();
  const { showToast } = useToast();

  // Helper function to convert recipe ingredients to proper format
  const convertIngredients = useCallback((recipeIngredients?: string[] | RecipeIngredient[]): RecipeIngredient[] => {
    if (!recipeIngredients || recipeIngredients.length === 0) {
      // Fallback mock ingredients if none provided
      return [{
        id: 1,
        name: 'Pasta',
        amount: '100g'
      }, {
        id: 2,
        name: 'Cherry Tomatoes',
        amount: '200g'
      }, {
        id: 3,
        name: 'Olive Oil',
        amount: '2 tbsp'
      }, {
        id: 4,
        name: 'Garlic',
        amount: '2 cloves'
      }, {
        id: 5,
        name: 'Fresh Basil',
        amount: 'handful'
      }, {
        id: 6,
        name: 'Parmesan Cheese',
        amount: '30g'
      }, {
        id: 7,
        name: 'Salt',
        amount: 'to taste'
      }, {
        id: 8,
        name: 'Black Pepper',
        amount: 'to taste'
      }];
    }

    // If already in proper format, return as is
    if (typeof recipeIngredients[0] === 'object' && 'id' in recipeIngredients[0]) {
      return recipeIngredients as RecipeIngredient[];
    }

    // Convert string array to proper ingredient objects
    return (recipeIngredients as string[]).map((ingredient, index) => {
      // Parse common ingredient patterns like "2 tbsp olive oil" or "1 onion, diced"
      const parts = ingredient.trim().split(/\s+/);
      let amount = '';
      let name = ingredient;

      // Try to extract amount and unit from beginning
      if (parts.length > 1) {
        const firstPart = parts[0];
        const secondPart = parts[1];
        
        // Check if first part is a number or fraction
        if (/^[\d\/\.\-]+$/.test(firstPart)) {
          // Check if second part is a unit
          const commonUnits = ['tbsp', 'tsp', 'cup', 'cups', 'oz', 'lb', 'lbs', 'g', 'kg', 'ml', 'l', 'cloves', 'slices', 'can', 'bottle'];
          if (commonUnits.some(unit => secondPart.toLowerCase().includes(unit))) {
            amount = `${firstPart} ${secondPart}`;
            name = parts.slice(2).join(' ');
          } else {
            amount = firstPart;
            name = parts.slice(1).join(' ');
          }
        }
      }

      // Clean up name - remove commas and extra descriptors
      name = name.replace(/^,\s*/, '').replace(/,.*$/, '').trim();
      
      // If we couldn't extract amount, use the original as name
      if (!name) {
        name = ingredient;
        amount = 'As needed';
      }

      return {
        id: recipe.id * 1000 + index + 1, // Generate unique ID based on recipe ID
        name: name || ingredient,
        amount: amount || 'As needed'
      };
    });
  }, [recipe.id]);

  // Convert ingredients using the helper function
  const ingredients = convertIngredients(recipe.ingredients);

  // Enhanced steps with timer information
  const steps = recipe.steps || [{
    id: 1,
    instruction: 'Bring a large pot of salted water to a boil. Add pasta and cook according to package instructions until al dente.',
    hasTimer: true,
    timerMinutes: 8
  }, {
    id: 2,
    instruction: 'Meanwhile, heat olive oil in a large pan over medium heat. Add minced garlic and cook until fragrant, about 30 seconds.',
    hasTimer: true,
    timerMinutes: 1
  }, {
    id: 3,
    instruction: 'Add halved cherry tomatoes to the pan and cook until they start to soften, about 5 minutes.',
    hasTimer: true,
    timerMinutes: 5
  }, {
    id: 4,
    instruction: 'Drain pasta, reserving a small cup of pasta water. Add pasta to the pan with tomatoes.'
  }, {
    id: 5,
    instruction: 'Toss everything together, adding a splash of pasta water if needed to create a light sauce.'
  }, {
    id: 6,
    instruction: 'Remove from heat and stir in torn basil leaves. Season with salt and pepper to taste.'
  }, {
    id: 7,
    instruction: 'Serve immediately with grated Parmesan cheese on top.'
  }];
  // Rating fallback
  const rating = recipe.rating || 4.7;
  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showImageLightbox) {
          setShowImageLightbox(false);
        } else if (cookingMode) {
          setCookingMode(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, showImageLightbox, cookingMode]);
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showImageLightbox && lightboxRef.current && !lightboxRef.current.contains(e.target as Node)) {
        setShowImageLightbox(false);
        e.stopPropagation();
        return;
      }
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, showImageLightbox]);
  // Timer functionality
  useEffect(() => {
    const timerIntervals: NodeJS.Timeout[] = [];
    Object.entries(runningTimers).forEach(([stepId, isRunning]) => {
      if (isRunning) {
        const interval = setInterval(() => {
          setTimerCountdowns(prev => {
            const newCountdowns = {
              ...prev
            };
            if (newCountdowns[Number(stepId)] > 0) {
              newCountdowns[Number(stepId)] -= 1;
            } else {
              clearInterval(interval);
              // Play a sound or show notification when timer ends
              // TODO: Add timer completion notification
              const newRunningTimers = {
                ...runningTimers
              };
              newRunningTimers[Number(stepId)] = false;
              setRunningTimers(newRunningTimers);
            }
            return newCountdowns;
          });
        }, 1000);
        timerIntervals.push(interval);
      }
    });
    return () => {
      timerIntervals.forEach(interval => clearInterval(interval));
    };
  }, [runningTimers]);
  const toggleIngredient = (id: number) => {
    setSelectedIngredients(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };
  const selectAllIngredients = () => {
    if (selectedIngredients.length === ingredients.length) {
      setSelectedIngredients([]);
    } else {
      setSelectedIngredients(ingredients.map(ing => ing.id));
    }
  };
  const startCookingMode = () => {
    setCookingMode(true);
    setCurrentStep(0);
  };
  const exitCookingMode = () => {
    setCookingMode(false);
  };
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };
  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  const toggleStepTimer = (stepId: number, minutes: number) => {
    // Initialize the timer if it doesn't exist
    if (!timerCountdowns[stepId]) {
      setTimerCountdowns(prev => ({
        ...prev,
        [stepId]: minutes * 60
      }));
    }
    // Toggle the timer
    setRunningTimers(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  const saveIngredientsToList = () => {
    try {
      // Get selected ingredients
      const itemsToSave = ingredients.filter(ing => selectedIngredients.includes(ing.id)).map(ing => ({
        ...ing,
        recipeTitle: recipe.title
      }));
      // Save to localStorage
      const existingList = localStorage.getItem('savedIngredients');
      const savedList = existingList ? JSON.parse(existingList) : [];
      const newList = [...savedList, ...itemsToSave];
      localStorage.setItem('savedIngredients', JSON.stringify(newList));
      // TODO: Integrate with backend when available
      // Show confirmation with toast
      showToast(`${itemsToSave.length} ingredient${itemsToSave.length !== 1 ? 's' : ''} saved to your shopping list!`, 'success');
    } catch (error) {
      console.error('Error saving ingredients:', error);
      showToast('Could not save ingredients. Please try again.', 'error');
    }
  };

  // Add recipe to cart with selected ingredients
  const handleAddToCart = async () => {
    if (isAddingToCart) return;
    
    setIsAddingToCart(true);
    
    try {
      // Create a recipe object with the properly formatted ingredients for the cart
      const recipeForCart = {
        ...recipe,
        ingredients: ingredients.filter(ing => selectedIngredients.includes(ing.id))
      };
      
      // Add to cart via context
      addRecipe(recipeForCart);
      
      // Show success feedback
      setShowAddedFeedback(true);
      const selectedCount = selectedIngredients.length;
      showToast(`${selectedCount} ingredient${selectedCount !== 1 ? 's' : ''} from "${recipe.title}" added to cart!`, 'success');
      
      // Auto-hide feedback after 2 seconds
      setTimeout(() => {
        setShowAddedFeedback(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error adding recipe to cart:', error);
      showToast('Could not add recipe to cart. Please try again.', 'error');
    } finally {
      setIsAddingToCart(false);
    }
  };
  // Render star rating
  const renderRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    return <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} size={14} className="text-yellow-400 fill-yellow-400" />)}
        {hasHalfStar && <div className="relative">
            <Star size={14} className="text-gray-300 fill-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
            </div>
          </div>}
        {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} size={14} className="text-gray-300 fill-gray-300" />)}
        <span className="ml-1 text-xs text-gray-600">{rating.toFixed(1)}</span>
      </div>;
  };
  // Handle image error and fallback
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
  if (!isOpen) return null;
  // Cooking mode view
  if (cookingMode) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-white sm:bg-black/50 sm:backdrop-blur-sm">
        <div ref={modalRef} className="relative flex flex-col w-full h-full sm:max-w-2xl sm:max-h-[90vh] bg-white sm:rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-[#6DBE45]/5">
            <button onClick={exitCookingMode} className="flex items-center text-gray-700 hover:text-[#6DBE45] transition-colors">
              <ArrowLeft size={18} className="mr-2" />
              <span className="font-medium">Back to Recipe</span>
            </button>
            <div className="flex items-center space-x-3">
              {/* Voice assistant placeholder */}
              <div className="relative">
                <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500" onMouseEnter={() => setShowTooltip('voice')} onMouseLeave={() => setShowTooltip(null)} aria-label="Voice Assistant (coming soon)">
                  <Mic size={18} />
                </button>
                {showTooltip === 'voice' && <div className="absolute right-0 top-full mt-1 z-10 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded-md shadow-sm whitespace-nowrap">
                    Voice Assistant (coming soon)
                    <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                  </div>}
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500" aria-label="Close cooking mode">
                <X size={18} />
              </button>
            </div>
          </div>
          {/* Step indicator */}
          <div className="px-4 py-3 text-center bg-white border-b border-gray-100">
            <div className="text-sm font-medium text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>
            <div className="mt-2 w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#6DBE45] h-full rounded-full transition-all duration-300" style={{
              width: `${(currentStep + 1) / steps.length * 100}%`
            }}></div>
            </div>
          </div>
          {/* Current step */}
          <div className="flex-1 overflow-y-auto px-6 py-10 flex flex-col items-center justify-center">
            <div className="max-w-xl mx-auto text-center">
              <div className="w-16 h-16 rounded-full bg-[#6DBE45]/10 text-[#6DBE45] font-bold flex items-center justify-center mx-auto mb-6 text-xl">
                {steps[currentStep].id}
              </div>
              <p className="text-xl sm:text-2xl text-gray-800 mb-8 leading-relaxed">
                {steps[currentStep].instruction}
              </p>
              {steps[currentStep].hasTimer && <div className="mt-4 flex flex-col items-center">
                  <button onClick={() => toggleStepTimer(steps[currentStep].id, steps[currentStep].timerMinutes || 5)} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${runningTimers[steps[currentStep].id] ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-[#6DBE45]/10 text-[#6DBE45] hover:bg-[#6DBE45]/20'}`}>
                    <Timer size={16} className="mr-2" />
                    {runningTimers[steps[currentStep].id] ? `Stop Timer (${formatTime(timerCountdowns[steps[currentStep].id] || 0)})` : `Start ${steps[currentStep].timerMinutes} Min Timer`}
                  </button>
                  {/* TODO: Add timer sound notification on completion */}
                </div>}
            </div>
          </div>
          {/* Navigation footer */}
          <div className="p-4 border-t border-gray-100 bg-white flex justify-between">
            <button onClick={goToPrevStep} disabled={currentStep === 0} className={`flex items-center px-4 py-2.5 rounded-lg font-medium ${currentStep === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
              <ChevronLeft size={18} className="mr-1" />
              Previous
            </button>
            <button onClick={goToNextStep} disabled={currentStep === steps.length - 1} className={`flex items-center px-4 py-2.5 rounded-lg font-medium ${currentStep === steps.length - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#6DBE45] text-white hover:bg-[#6DBE45]/90'}`}>
              Next
              <ChevronRight size={18} className="ml-1" />
            </button>
          </div>
        </div>
      </div>;
  }
  // Image lightbox
  const renderLightbox = () => {
    if (!showImageLightbox) return null;
    return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm">
        <div ref={lightboxRef} className="relative max-w-4xl max-h-[90vh] p-2">
          <button onClick={() => setShowImageLightbox(false)} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors" aria-label="Close fullscreen image">
            <X size={20} />
          </button>
          <img src={getImageSrc()} alt={recipe.title} onError={handleImageError} className="max-w-full max-h-[85vh] object-contain rounded-lg" />
        </div>
      </div>;
  };
  // Regular recipe view
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {renderLightbox()}
      <div ref={modalRef} className="relative flex flex-col w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-300 sm:zoom-in-90" onClick={e => e.stopPropagation()}>
        {/* Close button */}
        <button onClick={onClose} className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-gray-200 transition-colors" aria-label="Close modal">
          <X size={18} />
        </button>
        {/* Recipe image */}
        <div className="relative w-full h-48 sm:h-56 overflow-hidden">
          <img src={getImageSrc()} alt={recipe.title} onError={handleImageError} className="w-full h-full object-cover cursor-pointer" onClick={() => setShowImageLightbox(true)} />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent"></div>
          {/* Expand image button */}
          <button onClick={() => setShowImageLightbox(true)} className="absolute top-3 right-12 flex items-center justify-center h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm shadow-sm text-gray-700 hover:bg-gray-200 transition-colors" aria-label="View full image">
            <Maximize size={16} />
          </button>
          {/* Favorite button */}
          <div className="relative">
            <button onClick={onFavoriteToggle} onMouseEnter={() => setShowTooltip('favorite')} onMouseLeave={() => setShowTooltip(null)} className={`absolute top-3 left-3 flex items-center justify-center h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-colors ${isFavorited ? 'text-[#6DBE45]' : 'text-gray-500 hover:text-gray-700'}`} aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}>
              <Heart size={18} fill={isFavorited ? '#6DBE45' : 'none'} />
            </button>
            {showTooltip === 'favorite' && <div className="absolute left-3 top-12 z-10 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded-md shadow-sm whitespace-nowrap">
                {isFavorited ? 'Remove from Favourites' : 'Add to Favourites'}
                <div className="absolute -top-1 left-3 w-2 h-2 bg-gray-800 transform rotate-45"></div>
              </div>}
          </div>
          {/* Title overlay and rating */}
          <div className="absolute bottom-4 left-4 right-12 flex justify-between items-end">
            <h2 className="text-white text-xl font-semibold line-clamp-2 mr-2">
              {recipe.title}
            </h2>
            <div className="bg-white/90 backdrop-blur-sm rounded-md px-2 py-1">
              {renderRating(rating)}
            </div>
          </div>
        </div>
        {/* Recipe info bar */}
        <div className="flex items-center px-4 py-3 bg-gray-50 text-sm border-b border-gray-100">
          <div className="flex items-center text-gray-600 mr-4">
            <Clock size={16} className="mr-1.5" />
            <span>{recipe.time}</span>
          </div>
          <div className="flex items-center text-gray-600 mr-4">
            <Users size={16} className="mr-1.5" />
            <span>{recipe.servings || '2 servings'}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <DollarSign size={16} className="mr-1.5" />
            <span>{recipe.price}</span>
          </div>
        </div>
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Ingredients section */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800">Ingredients</h3>
              <button onClick={selectAllIngredients} className="text-[#6DBE45] text-sm font-medium flex items-center">
                {selectedIngredients.length === ingredients.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <ul className="space-y-2">
              {ingredients.map(ingredient => <li key={ingredient.id} className="flex items-start">
                  <div className={`flex-shrink-0 w-5 h-5 border rounded mr-2 mt-0.5 flex items-center justify-center cursor-pointer ${selectedIngredients.includes(ingredient.id) ? 'bg-[#6DBE45] border-[#6DBE45]' : 'border-gray-300'}`} onClick={() => toggleIngredient(ingredient.id)} onMouseEnter={() => selectedIngredients.includes(ingredient.id) && setShowTooltip(`ingredient-${ingredient.id}`)} onMouseLeave={() => setShowTooltip(null)}>
                    {selectedIngredients.includes(ingredient.id) && <Check size={12} className="text-white" />}
                  </div>
                  {showTooltip === `ingredient-${ingredient.id}` && <div className="absolute ml-6 mt-0 z-10 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded-md shadow-sm whitespace-nowrap">
                      Added to Cart
                      <div className="absolute -left-1 top-2 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                    </div>}
                  <div className="flex-1">
                    <span className="text-sm text-gray-800">
                      {ingredient.name}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {ingredient.amount}
                    </span>
                  </div>
                </li>)}
            </ul>
            <div className="flex gap-2 mt-4">
              <div className="relative flex-1">
                <button 
                  onClick={handleAddToCart}
                  disabled={selectedIngredients.length === 0 || isAddingToCart}
                  className={`w-full flex items-center justify-center text-sm font-medium py-2 px-4 rounded-lg transition-colors ${
                    showAddedFeedback 
                      ? 'bg-green-50 text-green-600 border border-green-200'
                      : selectedIngredients.length === 0 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-[#6DBE45]/10 hover:bg-[#6DBE45]/20 text-[#6DBE45]'
                  }`}
                  onMouseEnter={() => !showAddedFeedback && setShowTooltip('add-cart')} 
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  {isAddingToCart ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#6DBE45] border-t-transparent mr-2"></div>
                      Adding...
                    </>
                  ) : showAddedFeedback ? (
                    <>
                      <Check size={16} className="mr-2 text-green-600" />
                      Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={16} className="mr-2" />
                      Add Selected to Cart
                    </>
                  )}
                </button>
                {showTooltip === 'add-cart' && !showAddedFeedback && (
                  <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 z-10 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded-md shadow-sm whitespace-nowrap">
                    Add {selectedIngredients.length} ingredient{selectedIngredients.length !== 1 ? 's' : ''} to cart
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                  </div>
                )}
              </div>
              <button className="flex-1 flex items-center justify-center bg-white border border-[#6DBE45] text-[#6DBE45] hover:bg-[#6DBE45]/5 text-sm font-medium py-2 px-4 rounded-lg transition-colors" disabled={selectedIngredients.length === 0} onClick={saveIngredientsToList}>
                <Save size={16} className="mr-2" />
                Save Ingredients
              </button>
            </div>
          </div>
          {/* Nutrition section */}
          {recipe.nutrition && (
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3">Nutrition Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-gray-800">{recipe.nutrition.calories}</div>
                  <div className="text-xs text-gray-500">Calories</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-gray-800">{recipe.nutrition.protein}</div>
                  <div className="text-xs text-gray-500">Protein</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-gray-800">{recipe.nutrition.carbs}</div>
                  <div className="text-xs text-gray-500">Carbs</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-gray-800">{recipe.nutrition.fat}</div>
                  <div className="text-xs text-gray-500">Fat</div>
                </div>
              </div>
              {recipe.nutrition.fiber && (
                <div className="mt-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-gray-800">{recipe.nutrition.fiber}</div>
                    <div className="text-xs text-gray-500">Fiber</div>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Steps section */}
          <div className="p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Instructions</h3>
            <ol className="space-y-4">
              {steps.map(step => <li key={step.id} className="flex">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#6DBE45]/10 text-[#6DBE45] font-medium flex items-center justify-center mr-3 mt-0.5">
                    {step.id}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{step.instruction}</p>
                    {step.hasTimer && <button onClick={() => toggleStepTimer(step.id, step.timerMinutes || 5)} className={`mt-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium ${runningTimers[step.id] ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        <Timer size={12} className="mr-1" />
                        {runningTimers[step.id] ? `${formatTime(timerCountdowns[step.id] || 0)}` : `${step.timerMinutes} min timer`}
                      </button>}
                  </div>
                </li>)}
            </ol>
          </div>
        </div>
        {/* Sticky footer */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <button 
                onClick={() => {
                  // If no ingredients are selected, select all first
                  if (selectedIngredients.length === 0) {
                    setSelectedIngredients(ingredients.map(ing => ing.id));
                    // Add a small delay to show the selection, then add to cart
                    setTimeout(() => {
                      handleAddToCart();
                    }, 300);
                  } else {
                    handleAddToCart();
                  }
                }}
                disabled={isAddingToCart}
                className={`w-full flex items-center justify-center font-medium py-2.5 px-4 rounded-lg transition-colors ${
                  showAddedFeedback 
                    ? 'bg-green-50 text-green-600 border border-green-200'
                    : 'bg-white border border-[#6DBE45] text-[#6DBE45] hover:bg-[#6DBE45]/5'
                }`}
                onMouseEnter={() => !showAddedFeedback && setShowTooltip('cart')} 
                onMouseLeave={() => setShowTooltip(null)}
              >
                {isAddingToCart ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#6DBE45] border-t-transparent mr-2"></div>
                    Adding to Cart...
                  </>
                ) : showAddedFeedback ? (
                  <>
                    <Check size={18} className="mr-2 text-green-600" />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} className="mr-2" />
                    Add to Cart
                  </>
                )}
              </button>
              {showTooltip === 'cart' && !showAddedFeedback && (
                <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 z-10 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded-md shadow-sm whitespace-nowrap">
                  {selectedIngredients.length === 0 ? 'Add all ingredients to cart' : `Add ${selectedIngredients.length} selected ingredient${selectedIngredients.length !== 1 ? 's' : ''} to cart`}
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                </div>
              )}
            </div>
            <button className="flex-1 flex items-center justify-center bg-[#6DBE45] hover:bg-[#6DBE45]/90 text-white font-medium py-2.5 px-4 rounded-lg transition-colors" onClick={startCookingMode}>
              <ChefHat size={18} className="mr-2" />
              Start Cooking
            </button>
          </div>
        </div>
      </div>
    </div>;
}