import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { smartStoreAlgorithm, StoreRecommendation, CartAnalysis } from '../services/smartStoreAlgorithm';
import { productAvailabilityService } from '../services/productAvailabilityService';
import { usePostcode } from '../components/PostcodeChecker';

// Updated interfaces for ingredient-based cart
export interface CartIngredient {
  id: number;
  name: string;
  amount: string;
  recipeId: number;
  recipeTitle: string;
  price?: string;
  storeAvailability?: StoreAvailability[];
  available?: boolean;
  essential?: boolean;
}

interface StoreAvailability {
  storeId: string;
  storeName: string;
  available: boolean;
  price: string;
  inStock: boolean;
}

export interface CartItem {
  ingredient: CartIngredient;
  quantity: number;
  addedAt: string;
}

export interface CartState {
  items: CartItem[];
}

// Recipe interface for adding to cart
export interface Recipe {
  id: number;
  title: string;
  image: string;
  time: string;
  price: string;
  available?: boolean;
  mealType?: string;
  extendedIngredients?: any[];
  ingredients?: Array<{
    id: number;
    name: string;
    amount: string;
    essential?: boolean;
  }>;
}

type CartAction =
  | { type: 'ADD_RECIPE'; payload: Recipe }
  | { type: 'ADD_INGREDIENT'; payload: CartIngredient }
  | { type: 'REMOVE_INGREDIENT'; payload: number } // ingredient ID
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_FROM_STORAGE'; payload: CartState };

// Helper function to extract ingredients from recipe
const extractIngredientsFromRecipe = (recipe: Recipe): CartIngredient[] => {
  console.log('Extracting ingredients from recipe:', recipe.title, recipe);
  
  let ingredients: CartIngredient[] = [];
  
  try {
    // First try to use extendedIngredients from Spoonacular API
    if (recipe.extendedIngredients && Array.isArray(recipe.extendedIngredients) && recipe.extendedIngredients.length > 0) {
      console.log('Using extendedIngredients from Spoonacular:', recipe.extendedIngredients);
      ingredients = recipe.extendedIngredients.map((ing: any, index: number) => ({
        id: ing.id || (recipe.id * 1000 + index), // Generate unique ID if missing
        name: ing.name || ing.nameClean || ing.original || 'Unknown ingredient',
        amount: ing.amount && ing.unit ? `${ing.amount} ${ing.unit}` : ing.original || 'As needed',
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        price: '£0.50', // Default price - would come from pricing API
        available: true, // Default to available
        essential: true, // All ingredients are essential by default
        storeAvailability: [
          { storeId: 'tesco', storeName: 'Tesco', available: true, price: '£0.50', inStock: true },
          { storeId: 'asda', storeName: 'ASDA', available: true, price: '£0.45', inStock: true },
          { storeId: 'sainsburys', storeName: 'Sainsbury\'s', available: true, price: '£0.55', inStock: true }
        ]
      }));
    }
    // Fallback to recipe.ingredients if available
    else if (recipe.ingredients && Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
      console.log('Using recipe.ingredients fallback:', recipe.ingredients);
      ingredients = recipe.ingredients.map((ing) => ({
        id: ing.id || (recipe.id * 1000 + Math.floor(Math.random() * 1000)),
        name: ing.name,
        amount: ing.amount,
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        price: '£0.50',
        available: true,
        essential: ing.essential || true,
        storeAvailability: [
          { storeId: 'tesco', storeName: 'Tesco', available: true, price: '£0.50', inStock: true },
          { storeId: 'asda', storeName: 'ASDA', available: true, price: '£0.45', inStock: true }
        ]
      }));
    }
    // Final fallback - create mock ingredients based on recipe
    else {
      console.log('No ingredient data found, creating mock ingredients for recipe:', recipe.title);
      const mockIngredients = [
        'Main ingredient', 'Seasoning', 'Cooking oil', 'Salt', 'Pepper'
      ];
      ingredients = mockIngredients.map((name, index) => ({
        id: recipe.id * 1000 + index,
        name: name,
        amount: 'As needed',
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        price: '£0.50',
        available: true,
        essential: index < 3, // First 3 are essential
        storeAvailability: [
          { storeId: 'tesco', storeName: 'Tesco', available: true, price: '£0.50', inStock: true }
        ]
      }));
    }
  } catch (error) {
    console.error('Error extracting ingredients from recipe:', error);
    // Ultimate fallback
    ingredients = [{
      id: recipe.id * 1000,
      name: 'Unknown ingredients',
      amount: 'Check recipe',
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      price: '£0.00',
      available: false,
      essential: true,
      storeAvailability: []
    }];
  }
  
  console.log('Extracted ingredients:', ingredients);
  return ingredients;
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_RECIPE': {
      console.log('Adding recipe to cart:', action.payload.title);
      const ingredients = extractIngredientsFromRecipe(action.payload);
      const newItems: CartItem[] = [];
      
      ingredients.forEach(ingredient => {
        const existingItemIndex = state.items.findIndex(
          item => item.ingredient.id === ingredient.id
        );
        
        if (existingItemIndex >= 0) {
          // Ingredient already exists, increase quantity
          const existingItem = state.items[existingItemIndex];
          newItems.push({
            ...existingItem,
            quantity: existingItem.quantity + 1
          });
        } else {
          // New ingredient
          newItems.push({
            ingredient,
            quantity: 1,
            addedAt: new Date().toISOString()
          });
        }
      });
      
      // Merge with existing items (excluding ones we're updating)
      const updatedItems = [
        ...state.items.filter(item => 
          !ingredients.some(ing => ing.id === item.ingredient.id)
        ),
        ...newItems
      ];
      
      console.log('Cart updated with ingredients:', updatedItems);
      return { ...state, items: updatedItems };
    }

    case 'ADD_INGREDIENT': {
      const existingItemIndex = state.items.findIndex(
        item => item.ingredient.id === action.payload.id
      );

      if (existingItemIndex >= 0) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        };
        return { ...state, items: updatedItems };
      } else {
        return {
          ...state,
          items: [...state.items, {
            ingredient: action.payload,
            quantity: 1,
            addedAt: new Date().toISOString()
          }]
        };
      }
    }

    case 'REMOVE_INGREDIENT': {
      return {
        ...state,
        items: state.items.filter(item => item.ingredient.id !== action.payload)
      };
    }

    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.ingredient.id !== id)
        };
      }

      const updatedItems = state.items.map(item =>
        item.ingredient.id === id
          ? { ...item, quantity }
          : item
      );

      return { ...state, items: updatedItems };
    }

    case 'CLEAR_CART': {
      return { items: [] };
    }

    case 'LOAD_FROM_STORAGE': {
      return action.payload;
    }

    default:
      return state;
  }
};

interface CartContextType {
  state: CartState;
  addRecipe: (recipe: Recipe) => void;
  addIngredient: (ingredient: CartIngredient) => void;
  removeIngredient: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  isIngredientInCart: (id: number) => boolean;
  getIngredientQuantity: (id: number) => number;
  getTotalItems: () => number;
  getTotalRecipes: () => number;
  getRecipesByIds: (recipeIds: number[]) => string[];
  // Store recommendation features
  getStoreRecommendations: () => Promise<StoreRecommendation[]>;
  getCartAnalysis: () => Promise<CartAnalysis | null>;
  getBestStore: () => Promise<StoreRecommendation | null>;
  refreshAvailability: () => Promise<void>;
  isLoadingRecommendations: boolean;
  // Cart drawer state
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

const CartContext = createContext<{ 
  state: CartState; 
  dispatch: React.Dispatch<CartAction>;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
} | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [cartOpen, setCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('recipe-compare-cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsedCart });
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('recipe-compare-cart', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [state]);

  return (
    <CartContext.Provider value={{ state, dispatch, cartOpen, setCartOpen }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  const { state, dispatch, cartOpen, setCartOpen } = context;
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  
  // Get postcode and nearby stores from PostcodeContext
  // Note: This will need to be handled carefully to avoid circular dependencies
  let nearbyStores: any[] = [];
  try {
    const postcodeContext = usePostcode();
    nearbyStores = postcodeContext.nearbyStores;
  } catch (error) {
    // PostcodeContext not available - will use empty array
    console.warn('PostcodeContext not available in CartContext');
  }

  const addRecipe = (recipe: Recipe) => {
    console.log('useCart.addRecipe called with:', recipe.title);
    dispatch({ type: 'ADD_RECIPE', payload: recipe });
  };

  const addIngredient = (ingredient: CartIngredient) => {
    dispatch({ type: 'ADD_INGREDIENT', payload: ingredient });
  };

  const removeIngredient = (id: number) => {
    dispatch({ type: 'REMOVE_INGREDIENT', payload: id });
  };

  const updateQuantity = (id: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const isIngredientInCart = (id: number): boolean => {
    return state.items.some(item => item.ingredient.id === id);
  };

  const getIngredientQuantity = (id: number): number => {
    const item = state.items.find(item => item.ingredient.id === id);
    return item ? item.quantity : 0;
  };

  const getTotalItems = (): number => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalRecipes = (): number => {
    const uniqueRecipeIds = new Set(state.items.map(item => item.ingredient.recipeId));
    return uniqueRecipeIds.size;
  };

  const getRecipesByIds = (recipeIds: number[]): string[] => {
    const recipes = new Set<string>();
    state.items.forEach(item => {
      if (recipeIds.includes(item.ingredient.recipeId)) {
        recipes.add(item.ingredient.recipeTitle);
      }
    });
    return Array.from(recipes);
  };

  // Store recommendation methods
  const getStoreRecommendations = async (): Promise<StoreRecommendation[]> => {
    if (nearbyStores.length === 0 || state.items.length === 0) {
      return [];
    }

    setIsLoadingRecommendations(true);
    try {
      const ingredientNames = state.items.map(item => item.ingredient.name);
      const analysis = await smartStoreAlgorithm.analyzeCart(ingredientNames, nearbyStores);
      return analysis.storeComparison;
    } catch (error) {
      console.error('Error getting store recommendations:', error);
      return [];
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const getCartAnalysis = async (): Promise<CartAnalysis | null> => {
    if (nearbyStores.length === 0 || state.items.length === 0) {
      return null;
    }

    setIsLoadingRecommendations(true);
    try {
      const ingredientNames = state.items.map(item => item.ingredient.name);
      return await smartStoreAlgorithm.analyzeCart(ingredientNames, nearbyStores);
    } catch (error) {
      console.error('Error getting cart analysis:', error);
      return null;
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const getBestStore = async (): Promise<StoreRecommendation | null> => {
    const recommendations = await getStoreRecommendations();
    return recommendations.length > 0 ? recommendations[0] : null;
  };

  const refreshAvailability = async (): Promise<void> => {
    if (nearbyStores.length === 0 || state.items.length === 0) {
      return;
    }

    setIsLoadingRecommendations(true);
    try {
      // Clear the product availability cache to force fresh data
      productAvailabilityService.clearCache();
      
      // Get fresh availability data for all ingredients
      const ingredientNames = state.items.map(item => item.ingredient.name);
      await productAvailabilityService.checkMultipleIngredients(ingredientNames, nearbyStores);
    } catch (error) {
      console.error('Error refreshing availability:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  return {
    state,
    addRecipe,
    addIngredient,
    removeIngredient,
    updateQuantity,
    clearCart,
    isIngredientInCart,
    getIngredientQuantity,
    getTotalItems,
    getTotalRecipes,
    getRecipesByIds,
    getStoreRecommendations,
    getCartAnalysis,
    getBestStore,
    refreshAvailability,
    isLoadingRecommendations,
    cartOpen,
    setCartOpen,
  };
}; 