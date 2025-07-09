import { Store, Recipe } from '../types';
import { productAvailabilityService, ProductAvailabilityResult } from './productAvailabilityService';
import { locationServices } from './locationServices';

export interface RecipeAvailabilityAnalysis {
  recipe: Recipe;
  availabilityScore: number; // 0-100
  totalCost: number;
  availableIngredients: string[];
  missingIngredients: string[];
  suggestedSubstitutes: IngredientSubstitution[];
  bestStores: StoreRecommendation[];
  shouldInclude: boolean; // Whether to show this recipe to user
}

export interface IngredientSubstitution {
  originalIngredient: string;
  suggestedSubstitute: string;
  availabilityImprovement: number; // How many more stores have the substitute
  costDifference: number; // Price difference (positive = more expensive)
  reason: string;
}

export interface StoreRecommendation {
  store: Store;
  totalCost: number;
  availabilityScore: number;
  missingItems: number;
  missingItemNames: string[];
  estimatedSavings: number;
  deliveryAvailable: boolean;
  deliveryTime?: string;
  recommendationReason: string;
  overallScore: number; // Weighted score combining cost, availability, convenience
}

export interface ShoppingOptimization {
  recommendedStore: StoreRecommendation;
  alternativeStores: StoreRecommendation[];
  totalPotentialSavings: number;
  unavailableItems: string[];
  suggestedSubstitutions: IngredientSubstitution[];
  recommendations: string[];
}

export interface CartAnalysis {
  totalIngredients: number;
  totalRecipes: number;
  storeComparison: StoreRecommendation[];
  optimization: ShoppingOptimization;
  recipeRecommendations: RecipeAvailabilityAnalysis[];
}

export class SmartStoreAlgorithm {
  private static instance: SmartStoreAlgorithm;
  
  // Configuration thresholds
  private readonly MIN_AVAILABILITY_THRESHOLD = 60; // Minimum % of ingredients available
  private readonly MAX_MISSING_ESSENTIAL_INGREDIENTS = 1; // Max essential ingredients that can be missing
  private readonly COST_WEIGHT = 0.4; // Weight for cost in overall score
  private readonly AVAILABILITY_WEIGHT = 0.4; // Weight for availability
  private readonly CONVENIENCE_WEIGHT = 0.2; // Weight for delivery/location convenience

  static getInstance(): SmartStoreAlgorithm {
    if (!SmartStoreAlgorithm.instance) {
      SmartStoreAlgorithm.instance = new SmartStoreAlgorithm();
    }
    return SmartStoreAlgorithm.instance;
  }

  /**
   * Analyze a recipe's availability across stores and determine if it should be shown
   */
  async analyzeRecipeAvailability(
    recipe: Recipe,
    stores: Store[],
    options: {
      includeSubstitutes?: boolean;
      prioritizeOrganic?: boolean;
      maxBudget?: number;
    } = {}
  ): Promise<RecipeAvailabilityAnalysis> {
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      return this.createEmptyAnalysis(recipe);
    }

    // Get availability for all ingredients
    const ingredientNames = recipe.ingredients.map(ing => ing.name);
    const availabilityResults = await productAvailabilityService.checkMultipleIngredients(
      ingredientNames,
      stores,
      options
    );

    // Analyze availability by store
    const storeAnalysis = this.analyzeStoreAvailability(availabilityResults, stores);
    
    // Calculate overall metrics
    const availabilityScore = this.calculateRecipeAvailabilityScore(availabilityResults, recipe);
    const totalCost = this.calculateAverageCost(availabilityResults);
    
    // Identify missing ingredients
    const { available, missing } = this.categorizeIngredients(availabilityResults, recipe);
    
    // Generate substitution suggestions
    const substitutes = await this.generateSubstitutionSuggestions(missing, stores, options);
    
    // Determine if recipe should be included
    const shouldInclude = this.shouldIncludeRecipe(
      recipe, 
      availabilityScore, 
      missing, 
      totalCost, 
      options
    );

    return {
      recipe,
      availabilityScore,
      totalCost,
      availableIngredients: available,
      missingIngredients: missing,
      suggestedSubstitutes: substitutes,
      bestStores: storeAnalysis.slice(0, 3), // Top 3 stores
      shouldInclude
    };
  }

  /**
   * Analyze cart contents and provide comprehensive shopping optimization
   */
  async analyzeCart(
    cartIngredients: string[],
    stores: Store[],
    options: any = {}
  ): Promise<CartAnalysis> {
    // Get availability for all cart ingredients
    const availabilityResults = await productAvailabilityService.checkMultipleIngredients(
      cartIngredients,
      stores,
      options
    );

    // Analyze each store's performance
    const storeComparison = this.analyzeStoreAvailability(availabilityResults, stores);
    
    // Find optimal shopping strategy
    const optimization = this.optimizeShoppingStrategy(storeComparison, availabilityResults);
    
    // Generate recipe recommendations based on available ingredients
    const recipeRecommendations = await this.generateRecipeRecommendations(
      cartIngredients,
      stores,
      options
    );

    return {
      totalIngredients: cartIngredients.length,
      totalRecipes: 0, // Would need recipe context to determine this
      storeComparison,
      optimization,
      recipeRecommendations
    };
  }

  /**
   * Analyze how well each store can fulfill the shopping needs
   */
  private analyzeStoreAvailability(
    availabilityResults: ProductAvailabilityResult[],
    stores: Store[]
  ): StoreRecommendation[] {
    const storeRecommendations: StoreRecommendation[] = [];

    for (const store of stores) {
      let totalCost = 0;
      let availableCount = 0;
      let missingItems: string[] = [];
      let deliveryTime: string | undefined;

      for (const result of availabilityResults) {
        const storeInfo = result.stores.find(s => s.storeId === store.id);
        
        if (storeInfo && storeInfo.available && storeInfo.inStock) {
          totalCost += storeInfo.price;
          availableCount++;
          if (storeInfo.estimatedDelivery && !deliveryTime) {
            deliveryTime = storeInfo.estimatedDelivery;
          }
        } else {
          missingItems.push(result.productName);
        }
      }

      const availabilityScore = (availableCount / availabilityResults.length) * 100;
      const missingCount = missingItems.length;
      
      // Calculate overall score using weighted factors
      const costScore = this.calculateCostScore(totalCost, availabilityResults);
      const convenienceScore = this.calculateConvenienceScore(store);
      
      const overallScore = 
        (costScore * this.COST_WEIGHT) +
        (availabilityScore * this.AVAILABILITY_WEIGHT) +
        (convenienceScore * this.CONVENIENCE_WEIGHT);

      const recommendation: StoreRecommendation = {
        store,
        totalCost: Math.round(totalCost * 100) / 100,
        availabilityScore: Math.round(availabilityScore),
        missingItems: missingCount,
        missingItemNames: missingItems,
        estimatedSavings: 0, // Will be calculated relative to other stores
        deliveryAvailable: store.deliveryAvailable,
        deliveryTime,
        recommendationReason: this.generateRecommendationReason(
          availabilityScore,
          totalCost,
          store,
          missingCount
        ),
        overallScore: Math.round(overallScore)
      };

      storeRecommendations.push(recommendation);
    }

    // Calculate savings relative to most expensive option
    const maxCost = Math.max(...storeRecommendations.map(r => r.totalCost));
    storeRecommendations.forEach(rec => {
      rec.estimatedSavings = Math.round((maxCost - rec.totalCost) * 100) / 100;
    });

    // Sort by overall score (descending)
    return storeRecommendations.sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Generate shopping optimization strategy
   */
  private optimizeShoppingStrategy(
    storeRecommendations: StoreRecommendation[],
    availabilityResults: ProductAvailabilityResult[]
  ): ShoppingOptimization {
    const bestStore = storeRecommendations[0];
    const alternativeStores = storeRecommendations.slice(1, 4);
    
    // Find items that are unavailable across all stores
    const unavailableItems = availabilityResults
      .filter(result => result.availabilityScore < 50)
      .map(result => result.productName);
    
    // Generate substitution suggestions for unavailable items
    const suggestedSubstitutions: IngredientSubstitution[] = [];
    for (const item of unavailableItems) {
      const substitutes = productAvailabilityService.getIngredientSubstitutes(item);
      if (substitutes.length > 0) {
        suggestedSubstitutions.push({
          originalIngredient: item,
          suggestedSubstitute: substitutes[0],
          availabilityImprovement: 50, // Mock improvement
          costDifference: 0.50, // Mock cost difference
          reason: 'Original ingredient has limited availability'
        });
      }
    }

    const totalPotentialSavings = bestStore.estimatedSavings;
    
    return {
      recommendedStore: bestStore,
      alternativeStores,
      totalPotentialSavings,
      unavailableItems,
      suggestedSubstitutions,
      recommendations: this.generateGeneralRecommendations(
        storeRecommendations,
        unavailableItems,
        suggestedSubstitutions
      )
    };
  }

  /**
   * Calculate cost score (lower cost = higher score)
   */
  private calculateCostScore(cost: number, allResults: ProductAvailabilityResult[]): number {
    if (allResults.length === 0) return 50;
    
    const avgPrice = allResults.reduce((sum, result) => sum + result.averagePrice, 0) / allResults.length;
    const maxExpectedCost = avgPrice * allResults.length * 1.5; // 50% above average
    
    return Math.max(0, 100 - (cost / maxExpectedCost) * 100);
  }

  /**
   * Calculate convenience score based on store features
   */
  private calculateConvenienceScore(store: Store): number {
    let score = 0;
    
    // Distance (closer = better)
    if (store.distance <= 1) score += 40;
    else if (store.distance <= 2) score += 30;
    else if (store.distance <= 5) score += 20;
    else score += 10;
    
    // Opening hours
    if (store.isOpen) score += 30;
    
    // Delivery availability
    if (store.deliveryAvailable) score += 20;
    
    // Collection availability
    if (store.collectionAvailable) score += 10;
    
    return Math.min(100, score);
  }

  /**
   * Generate human-readable recommendation reason
   */
  private generateRecommendationReason(
    availabilityScore: number,
    totalCost: number,
    store: Store,
    missingCount: number
  ): string {
    if (availabilityScore >= 90 && missingCount === 0) {
      return `Best choice - has all items and ${store.deliveryAvailable ? 'offers delivery' : 'nearby location'}`;
    } else if (totalCost < 20) {
      return `Most affordable option with ${Math.round(availabilityScore)}% availability`;
    } else if (missingCount <= 1) {
      return `Great availability (${Math.round(availabilityScore)}%) with only ${missingCount} missing item`;
    } else if (store.deliveryAvailable && store.distance > 3) {
      return `Convenient delivery option despite distance`;
    } else {
      return `Good local option with ${Math.round(availabilityScore)}% item availability`;
    }
  }

  /**
   * Generate general shopping recommendations
   */
  private generateGeneralRecommendations(
    stores: StoreRecommendation[],
    unavailableItems: string[],
    substitutions: IngredientSubstitution[]
  ): string[] {
    const recommendations: string[] = [];
    
    const bestStore = stores[0];
    recommendations.push(`Shop at ${bestStore.store.name} for the best overall value and availability`);
    
    if (bestStore.estimatedSavings > 5) {
      recommendations.push(`Save £${bestStore.estimatedSavings.toFixed(2)} compared to the most expensive option`);
    }
    
    if (unavailableItems.length > 0) {
      recommendations.push(`Consider substitutes for ${unavailableItems.length} unavailable item${unavailableItems.length > 1 ? 's' : ''}`);
    }
    
    if (bestStore.deliveryAvailable) {
      recommendations.push(`Delivery available${bestStore.deliveryTime ? ` in ${bestStore.deliveryTime}` : ''}`);
    }
    
    return recommendations;
  }

  /**
   * Helper methods
   */
  private createEmptyAnalysis(recipe: Recipe): RecipeAvailabilityAnalysis {
    return {
      recipe,
      availabilityScore: 0,
      totalCost: 0,
      availableIngredients: [],
      missingIngredients: [],
      suggestedSubstitutes: [],
      bestStores: [],
      shouldInclude: false
    };
  }

  private calculateRecipeAvailabilityScore(
    results: ProductAvailabilityResult[],
    recipe: Recipe
  ): number {
    if (results.length === 0) return 0;
    
    const totalScore = results.reduce((sum, result) => sum + result.availabilityScore, 0);
    return Math.round(totalScore / results.length);
  }

  private calculateAverageCost(results: ProductAvailabilityResult[]): number {
    if (results.length === 0) return 0;
    
    const totalCost = results.reduce((sum, result) => sum + result.averagePrice, 0);
    return Math.round(totalCost * 100) / 100;
  }

  private categorizeIngredients(
    results: ProductAvailabilityResult[],
    recipe: Recipe
  ): { available: string[]; missing: string[] } {
    const available: string[] = [];
    const missing: string[] = [];
    
    results.forEach(result => {
      if (result.availabilityScore >= 50) {
        available.push(result.productName);
      } else {
        missing.push(result.productName);
      }
    });
    
    return { available, missing };
  }

  private async generateSubstitutionSuggestions(
    missingIngredients: string[],
    stores: Store[],
    options: any
  ): Promise<IngredientSubstitution[]> {
    const substitutions: IngredientSubstitution[] = [];
    
    for (const ingredient of missingIngredients) {
      const substitutes = productAvailabilityService.getIngredientSubstitutes(ingredient);
      
      if (substitutes.length > 0) {
        // For simplicity, suggest the first substitute
        // In a real implementation, you'd check availability of substitutes
        substitutions.push({
          originalIngredient: ingredient,
          suggestedSubstitute: substitutes[0],
          availabilityImprovement: 50,
          costDifference: 0,
          reason: 'Suitable alternative with better availability'
        });
      }
    }
    
    return substitutions;
  }

  private shouldIncludeRecipe(
    recipe: Recipe,
    availabilityScore: number,
    missingIngredients: string[],
    totalCost: number,
    options: any
  ): boolean {
    // Filter out recipes with too many missing ingredients
    if (availabilityScore < this.MIN_AVAILABILITY_THRESHOLD) {
      return false;
    }
    
    // Check for missing essential ingredients
    const essentialMissing = missingIngredients.filter(ingredient => {
      const recipeIngredient = recipe.ingredients?.find(ing => ing.name === ingredient);
      return recipeIngredient?.essential;
    });
    
    if (essentialMissing.length > this.MAX_MISSING_ESSENTIAL_INGREDIENTS) {
      return false;
    }
    
    // Check budget constraints
    if (options.maxBudget && totalCost > options.maxBudget) {
      return false;
    }
    
    return true;
  }

  private async generateRecipeRecommendations(
    availableIngredients: string[],
    stores: Store[],
    options: any
  ): Promise<RecipeAvailabilityAnalysis[]> {
    // This would typically query a recipe database to find recipes
    // that use the available ingredients. For now, return empty array.
    return [];
  }
}

// Export singleton instance
export const smartStoreAlgorithm = SmartStoreAlgorithm.getInstance(); 