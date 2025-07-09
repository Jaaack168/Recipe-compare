// Static recipe API that loads from consolidated JSON file
import { ProductAvailabilityService } from '../services/productAvailabilityService';
import { usePostcode } from '../components/PostcodeChecker';

export interface Recipe {
  id: number;
  title: string;
  image: string;
  time: string;
  price: string;
  available: boolean;
  mealType: string;
  servings?: number;
  rating?: number;
  summary?: string;
  ingredients?: string[];
  instructions?: string[];
  tags?: string[];
  nutrition?: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
    fiber: string;
  };
}

export interface RecipeSearchResult {
  recipes: Recipe[];
  totalResults: number;
  offset?: number;
  number?: number;
  filteredOut?: number; // Number of recipes filtered out due to availability
}

export interface FilterOptions {
  diet?: string;
  intolerances?: string;
  type?: string;
  tags?: string;
  number?: number;
  checkAvailability?: boolean; // Whether to filter based on ingredient availability
  availabilityThreshold?: number; // Minimum percentage of ingredients that must be available (0-1)
}

interface RecipeData {
  suggested: Recipe[];
  trending: Recipe[];
  quickAndEasy: Recipe[];
  highProtein: Recipe[];
  vegan: Recipe[];
  desserts: Recipe[];
  budgetFriendly: Recipe[];
  highCalorie: Recipe[];
  breakfast: Recipe[];
  lunch: Recipe[];
  dinner: Recipe[];
  snacks: Recipe[];
  appetizers: Recipe[];
}

// Load recipes from consolidated JSON file
async function loadRecipes(): Promise<RecipeData> {
  try {
    // Try to fetch from public directory first (for production builds)
    let response = await fetch('/recipes.json');
    
    // If that fails, try the src directory (for development)
    if (!response.ok) {
      response = await fetch('/src/data/recipes.json');
    }
    
    if (!response.ok) {
      throw new Error(`Failed to load recipes: ${response.status} ${response.statusText}`);
    }
    const recipes = await response.json();
    return recipes;
  } catch (error) {
    console.error('Error loading recipes:', error);
    // Return empty data structure instead of throwing
    return {
      suggested: [],
      trending: [],
      quickAndEasy: [],
      highProtein: [],
      vegan: [],
      desserts: [],
      budgetFriendly: [],
      highCalorie: [],
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
      appetizers: []
    };
  }
}

// Cache for loaded recipes
let recipesCache: RecipeData | null = null;

async function getRecipes(): Promise<RecipeData> {
  if (!recipesCache) {
    recipesCache = await loadRecipes();
  }
  return recipesCache;
}

/**
 * Check if a recipe's ingredients are available based on current location
 */
async function checkRecipeAvailability(
  recipe: Recipe, 
  stores: any[] = [], 
  availabilityThreshold: number = 0.75
): Promise<{ available: boolean; availabilityScore: number; missingIngredients: string[] }> {
  // If recipe has no ingredients data, assume available but flag as potentially incomplete
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    return {
      available: recipe.available !== false, // Use existing available flag as fallback
      availabilityScore: recipe.available !== false ? 1 : 0,
      missingIngredients: []
    };
  }

  // If no stores provided, use mock availability based on recipe's available flag
  if (stores.length === 0) {
    return {
      available: recipe.available !== false,
      availabilityScore: recipe.available !== false ? 1 : 0,
      missingIngredients: recipe.available === false ? ['Unknown ingredients'] : []
    };
  }

  try {
    const availabilityService = ProductAvailabilityService.getInstance();
    const ingredientResults = await availabilityService.checkMultipleIngredients(
      recipe.ingredients,
      stores,
      { includeSubstitutes: true }
    );

    let availableCount = 0;
    const missingIngredients: string[] = [];

    ingredientResults.forEach((result: any, index: number) => {
      const ingredientName = recipe.ingredients![index];
      if (result.availabilityScore >= 0.5) { // At least 50% of stores have the ingredient
        availableCount++;
      } else {
        missingIngredients.push(ingredientName);
      }
    });

    const availabilityScore = availableCount / recipe.ingredients.length;
    const available = availabilityScore >= availabilityThreshold;

    return {
      available,
      availabilityScore,
      missingIngredients
    };
  } catch (error) {
    console.error('Error checking recipe availability:', error);
    // Fallback to recipe's existing available flag
    return {
      available: recipe.available !== false,
      availabilityScore: recipe.available !== false ? 1 : 0,
      missingIngredients: []
    };
  }
}

/**
 * Filter recipes based on availability criteria
 */
async function filterRecipesByAvailability(
  recipes: Recipe[], 
  options: {
    checkAvailability?: boolean;
    availabilityThreshold?: number;
    stores?: any[];
    requireImage?: boolean;
    requireNutrition?: boolean;
  } = {}
): Promise<{ filteredRecipes: Recipe[]; filteredOut: number }> {
  const {
    checkAvailability = true,
    availabilityThreshold = 0.75,
    stores = [],
    requireImage = true,
    requireNutrition = false
  } = options;

  if (!checkAvailability) {
    // Basic filtering without availability check
    const filtered = recipes.filter(recipe => {
      // Check for critical fields
      if (!recipe.title || !recipe.time || !recipe.price) {
        return false;
      }

      // Check for valid image
      if (requireImage && (!recipe.image || recipe.image === '' || recipe.image === '/assets/placeholder.svg')) {
        return false;
      }

      // Check for nutritional info if required
      if (requireNutrition && !recipe.nutrition) {
        return false;
      }

      return true;
    });

    return {
      filteredRecipes: filtered,
      filteredOut: recipes.length - filtered.length
    };
  }

  // Full availability checking
  const filteredRecipes: Recipe[] = [];
  let filteredOutCount = 0;

  for (const recipe of recipes) {
    // Check critical fields first
    if (!recipe.title || !recipe.time || !recipe.price) {
      filteredOutCount++;
      continue;
    }

    // Check for valid image
    if (requireImage && (!recipe.image || recipe.image === '' || recipe.image === '/assets/placeholder.svg')) {
      filteredOutCount++;
      continue;
    }

    // Check for nutritional info if required
    if (requireNutrition && !recipe.nutrition) {
      filteredOutCount++;
      continue;
    }

    // Check ingredient availability
    try {
      const availabilityCheck = await checkRecipeAvailability(recipe, stores, availabilityThreshold);
      if (availabilityCheck.available) {
        // Update recipe availability status
        const updatedRecipe = {
          ...recipe,
          available: true
        };
        filteredRecipes.push(updatedRecipe);
      } else {
        filteredOutCount++;
      }
    } catch (error) {
      console.error(`Error checking availability for recipe ${recipe.title}:`, error);
      // Include recipe if availability check fails (graceful degradation)
      filteredRecipes.push(recipe);
    }
  }

  return {
    filteredRecipes,
    filteredOut: filteredOutCount
  };
}

/**
 * Get fallback message when no recipes are available
 */
function getNoRecipesMessage(filteredOut: number, totalOriginal: number): string {
  if (filteredOut === 0) {
    return "No recipes found matching your criteria.";
  }
  
  if (filteredOut === totalOriginal) {
    return "No recipes available right now — try adjusting your filters or checking back later.";
  }
  
  return `Only showing ${totalOriginal - filteredOut} of ${totalOriginal} recipes. ${filteredOut} recipes were filtered out due to ingredient availability.`;
}

/**
 * Get fallback message when no recipes are available (exported version)
 */
export { getNoRecipesMessage };

/**
 * Get suggested recipes
 */
export async function fetchSuggestedRecipes(
  number: number = 5,
  options: FilterOptions = {}
): Promise<RecipeSearchResult> {
  const recipes = await getRecipes();
  const originalRecipes = recipes.suggested;
  
  // Apply availability filtering if requested
  const {
    checkAvailability = false,
    availabilityThreshold = 0.75,
    ...filterOptions
  } = options;

  let selectedRecipes = originalRecipes.slice(0, number * 2); // Get more than needed for filtering
  let filteredOut = 0;

  if (checkAvailability) {
    const result = await filterRecipesByAvailability(selectedRecipes, {
      checkAvailability: true,
      availabilityThreshold,
      requireImage: false, // Be lenient for suggested recipes
      requireNutrition: false
    });
    selectedRecipes = result.filteredRecipes.slice(0, number);
    filteredOut = result.filteredOut;
  } else {
    selectedRecipes = selectedRecipes.slice(0, number);
  }
  
  return {
    recipes: selectedRecipes,
    totalResults: selectedRecipes.length,
    number: selectedRecipes.length,
    filteredOut
  };
}

/**
 * Get trending recipes
 */
export async function fetchTrendingRecipes(
  number: number = 5,
  options: FilterOptions = {}
): Promise<RecipeSearchResult> {
  const recipes = await getRecipes();
  const originalRecipes = recipes.trending;
  
  const {
    checkAvailability = false,
    availabilityThreshold = 0.75,
    ...filterOptions
  } = options;

  let selectedRecipes = originalRecipes.slice(0, number * 2);
  let filteredOut = 0;

  if (checkAvailability) {
    const result = await filterRecipesByAvailability(selectedRecipes, {
      checkAvailability: true,
      availabilityThreshold,
      requireImage: false,
      requireNutrition: false
    });
    selectedRecipes = result.filteredRecipes.slice(0, number);
    filteredOut = result.filteredOut;
  } else {
    selectedRecipes = selectedRecipes.slice(0, number);
  }
  
  return {
    recipes: selectedRecipes,
    totalResults: selectedRecipes.length,
    number: selectedRecipes.length,
    filteredOut
  };
}

/**
 * Get quick & easy recipes
 */
export async function fetchQuickEasyRecipes(
  number: number = 5,
  options: FilterOptions = {}
): Promise<RecipeSearchResult> {
  const recipes = await getRecipes();
  const originalRecipes = recipes.quickAndEasy;
  
  const {
    checkAvailability = false,
    availabilityThreshold = 0.75,
    ...filterOptions
  } = options;

  let selectedRecipes = originalRecipes.slice(0, number * 2);
  let filteredOut = 0;

  if (checkAvailability) {
    const result = await filterRecipesByAvailability(selectedRecipes, {
      checkAvailability: true,
      availabilityThreshold,
      requireImage: false,
      requireNutrition: false
    });
    selectedRecipes = result.filteredRecipes.slice(0, number);
    filteredOut = result.filteredOut;
  } else {
    selectedRecipes = selectedRecipes.slice(0, number);
  }
  
  return {
    recipes: selectedRecipes,
    totalResults: selectedRecipes.length,
    number: selectedRecipes.length,
    filteredOut
  };
}

/**
 * Get high protein recipes
 */
export async function fetchHighProteinRecipes(
  number: number = 5,
  options: FilterOptions = {}
): Promise<RecipeSearchResult> {
  const recipes = await getRecipes();
  const originalRecipes = recipes.highProtein;
  
  const {
    checkAvailability = false,
    availabilityThreshold = 0.75,
    ...filterOptions
  } = options;

  let selectedRecipes = originalRecipes.slice(0, number * 2);
  let filteredOut = 0;

  if (checkAvailability) {
    const result = await filterRecipesByAvailability(selectedRecipes, {
      checkAvailability: true,
      availabilityThreshold,
      requireImage: false,
      requireNutrition: false
    });
    selectedRecipes = result.filteredRecipes.slice(0, number);
    filteredOut = result.filteredOut;
  } else {
    selectedRecipes = selectedRecipes.slice(0, number);
  }
  
  return {
    recipes: selectedRecipes,
    totalResults: selectedRecipes.length,
    number: selectedRecipes.length,
    filteredOut
  };
}

/**
 * Search for recipes across all categories
 */
export async function searchRecipes(query: string): Promise<RecipeSearchResult> {
  if (!query || query.trim().length === 0) {
    return { recipes: [], totalResults: 0 };
  }

  const recipes = await getRecipes();
  const allRecipes = [
    ...recipes.suggested,
    ...recipes.trending,
    ...recipes.quickAndEasy,
    ...recipes.highProtein,
    ...recipes.vegan,
    ...recipes.desserts,
    ...recipes.budgetFriendly,
    ...recipes.highCalorie,
    ...recipes.breakfast,
    ...recipes.lunch,
    ...recipes.dinner,
    ...recipes.snacks,
    ...recipes.appetizers
  ];

  const filteredRecipes = allRecipes.filter(recipe => {
    const searchTerm = query.toLowerCase();
    return (
      recipe.title.toLowerCase().includes(searchTerm) ||
      recipe.summary?.toLowerCase().includes(searchTerm) ||
      recipe.mealType.toLowerCase().includes(searchTerm) ||
      recipe.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      recipe.ingredients?.some(ingredient => ingredient.toLowerCase().includes(searchTerm))
    );
  });

  return {
    recipes: filteredRecipes,
    totalResults: filteredRecipes.length
  };
}

/**
 * Get filtered recipes based on criteria
 */
export async function fetchFilteredRecipes(filters: FilterOptions = {}): Promise<RecipeSearchResult> {
  const recipes = await getRecipes();
  const allRecipes = [
    ...recipes.suggested,
    ...recipes.trending,
    ...recipes.quickAndEasy,
    ...recipes.highProtein,
    ...recipes.vegan,
    ...recipes.desserts,
    ...recipes.budgetFriendly,
    ...recipes.highCalorie,
    ...recipes.breakfast,
    ...recipes.lunch,
    ...recipes.dinner,
    ...recipes.snacks,
    ...recipes.appetizers
  ];

  let filteredRecipes = allRecipes;

  // Filter by diet
  if (filters.diet) {
    const dietFilter = filters.diet.toLowerCase();
    filteredRecipes = filteredRecipes.filter(recipe => 
      recipe.tags?.some(tag => tag.toLowerCase().includes(dietFilter)) ||
      recipe.mealType.toLowerCase().includes(dietFilter)
    );
  }

  // Filter by meal type
  if (filters.type) {
    const typeFilter = filters.type.toLowerCase();
    filteredRecipes = filteredRecipes.filter(recipe => 
      recipe.mealType.toLowerCase().includes(typeFilter) ||
      recipe.tags?.some(tag => tag.toLowerCase().includes(typeFilter))
    );
  }

  // Filter by tags
  if (filters.tags) {
    const tagFilter = filters.tags.toLowerCase();
    filteredRecipes = filteredRecipes.filter(recipe => 
      recipe.tags?.some(tag => tag.toLowerCase().includes(tagFilter))
    );
  }

  // Limit results
  if (filters.number) {
    filteredRecipes = filteredRecipes.slice(0, filters.number);
  }

  return {
    recipes: filteredRecipes,
    totalResults: filteredRecipes.length
  };
}

/**
 * Get random recipes from any category
 */
export async function fetchRandomRecipes(tags?: string, number: number = 5): Promise<RecipeSearchResult> {
  const recipes = await getRecipes();
  const allRecipes = [
    ...recipes.suggested,
    ...recipes.trending,
    ...recipes.quickAndEasy,
    ...recipes.highProtein,
    ...recipes.vegan,
    ...recipes.desserts,
    ...recipes.budgetFriendly,
    ...recipes.highCalorie,
    ...recipes.breakfast,
    ...recipes.lunch,
    ...recipes.dinner,
    ...recipes.snacks,
    ...recipes.appetizers
  ];

  let filteredRecipes = allRecipes;

  // Filter by tags if provided
  if (tags) {
    const tagFilter = tags.toLowerCase();
    filteredRecipes = allRecipes.filter(recipe => 
      recipe.tags?.some(tag => tag.toLowerCase().includes(tagFilter))
    );
  }

  // Shuffle and take random recipes
  const shuffled = filteredRecipes.sort(() => 0.5 - Math.random());
  const selectedRecipes = shuffled.slice(0, number);

  return {
    recipes: selectedRecipes,
    totalResults: selectedRecipes.length
  };
}

/**
 * Get recipes by specific category
 */
export async function fetchRecipesByCategory(
  category: keyof RecipeData, 
  number: number = 5
): Promise<RecipeSearchResult> {
  const recipes = await getRecipes();
  const categoryRecipes = recipes[category] || [];
  const selectedRecipes = categoryRecipes.slice(0, number);
  
  return {
    recipes: selectedRecipes,
    totalResults: selectedRecipes.length
  };
}

/**
 * Get recipes (alias for search)
 */
export async function fetchRecipes(query: string, number: number = 10): Promise<RecipeSearchResult> {
  const result = await searchRecipes(query);
  return {
    ...result,
    recipes: result.recipes.slice(0, number)
  };
}

/**
 * Check API status (always returns working since we're using static files)
 */
export async function checkApiStatus(): Promise<{ isWorking: boolean; reason?: string; suggestion?: string }> {
  try {
    await getRecipes();
    return { isWorking: true };
  } catch (error) {
    return {
      isWorking: false,
      reason: 'Failed to load local recipe data',
      suggestion: 'Check that recipes.json file exists in src/data/'
    };
  }
}

/**
 * Map filter strings to API parameters
 */
export function mapFilterToApiParams(filter: string): FilterOptions {
  const filterMap: { [key: string]: FilterOptions } = {
    'vegetarian': { diet: 'vegetarian' },
    'vegan': { diet: 'vegan' },
    'gluten-free': { intolerances: 'gluten' },
    'dairy-free': { intolerances: 'dairy' },
    'quick meals': { tags: 'quick' },
    'high protein': { tags: 'protein' },
    'low carb': { tags: 'low-carb' },
    'breakfast': { type: 'breakfast' },
    'lunch': { type: 'lunch' },
    'dinner': { type: 'dinner' },
    'snack': { type: 'snack' },
    'dessert': { type: 'dessert' },
    'appetizer': { type: 'appetizer' }
  };

  return filterMap[filter.toLowerCase()] || { tags: filter };
} 