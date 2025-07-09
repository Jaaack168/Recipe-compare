import { IngredientMatcher } from './IngredientMatcher.js';
import { DatabaseService } from '../database/connection.js';
import { 
  PriceComparisonRequest, 
  PriceComparisonResponse, 
  Supermarket, 
  IngredientMatch 
} from '../types/index.js';

interface StoreLocation {
  name: string;
  address: string;
  distance_miles: number;
}

export class PriceComparisonService {
  private matcher: IngredientMatcher;
  private db: DatabaseService;

  constructor() {
    this.matcher = new IngredientMatcher();
    this.db = DatabaseService.getInstance();
  }

  public async compareIngredientPrices(request: PriceComparisonRequest): Promise<PriceComparisonResponse> {
    const { ingredients, postcode, radius_miles = 10 } = request;
    
    // Validate inputs
    if (!ingredients || ingredients.length === 0) {
      throw new Error('No ingredients provided');
    }
    
    if (!postcode || !this.isValidPostcode(postcode)) {
      throw new Error('Invalid postcode provided');
    }

    try {
      // Get available supermarkets (for now, we'll use all supermarkets)
      // In a full implementation, this would check which stores are actually within radius
      const availableSupermarkets: Supermarket[] = ['tesco', 'asda', 'sainsburys', 'morrisons'];
      
      // Match ingredients to products for each supermarket
      const ingredientMatches = await this.matcher.matchIngredients(ingredients, availableSupermarkets);
      
      // Calculate costs and build response
      const storeResults = [];
      
      for (const supermarket of availableSupermarkets) {
        const matches = ingredientMatches[supermarket] || [];
        const storeResult = this.calculateStoreTotal(supermarket, matches, ingredients, postcode);
        storeResults.push(storeResult);
      }

      // Sort by total cost (ascending)
      storeResults.sort((a, b) => a.total_cost - b.total_cost);

      return {
        postcode,
        stores: storeResults,
        comparison_timestamp: new Date()
      };

    } catch (error) {
      console.error('Error in price comparison:', error);
      throw new Error(`Failed to compare prices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateStoreTotal(
    supermarket: Supermarket, 
    matches: IngredientMatch[], 
    originalIngredients: string[], 
    postcode: string
  ) {
    let totalCost = 0;
    let estimatedTotal = false;
    const missingIngredients: string[] = [];
    const successfulMatches: IngredientMatch[] = [];

    for (const ingredient of originalIngredients) {
      const match = matches.find(m => m.ingredient === ingredient);
      
      if (!match || match.matches.length === 0) {
        // No match found - use estimated price
        const estimatedPrice = this.getEstimatedPrice(ingredient, supermarket);
        totalCost += estimatedPrice;
        estimatedTotal = true;
        missingIngredients.push(ingredient);
      } else {
        // Use best match (highest confidence)
        const bestMatch = match.matches.sort((a, b) => b.confidence - a.confidence)[0];
        if (bestMatch) {
          totalCost += bestMatch.product.price;
          successfulMatches.push({
            ingredient: match.ingredient,
            matches: [bestMatch]
          });
        } else {
          // No valid matches, treat as missing
          const estimatedPrice = this.getEstimatedPrice(ingredient, supermarket);
          totalCost += estimatedPrice;
          estimatedTotal = true;
          missingIngredients.push(ingredient);
        }
      }
    }

    // Get store location info (mock for now)
    const storeLocation = this.getStoreLocation(supermarket, postcode);

    return {
      supermarket,
      total_cost: Math.round(totalCost * 100) / 100, // Round to 2 decimal places
      estimated_total: estimatedTotal,
      ingredient_matches: successfulMatches,
      missing_ingredients: missingIngredients,
      store_location: storeLocation
    };
  }

  private getEstimatedPrice(ingredient: string, supermarket: Supermarket): number {
    // Fallback pricing based on ingredient type and supermarket
    const ingredient_lower = ingredient.toLowerCase();
    
    // Category-based pricing estimates
    const categoryPrices: Record<string, number> = {
      // Meat & Fish
      'chicken': 5.50, 'beef': 8.00, 'pork': 6.00, 'salmon': 7.50, 'fish': 6.00,
      
      // Dairy
      'milk': 1.20, 'cheese': 3.50, 'butter': 2.50, 'cream': 2.00, 'yogurt': 2.80,
      
      // Vegetables
      'onion': 1.00, 'potato': 1.50, 'carrot': 1.20, 'tomato': 2.50, 'pepper': 2.00,
      'garlic': 0.80, 'ginger': 1.50,
      
      // Fruits
      'apple': 2.50, 'banana': 1.50, 'orange': 2.00, 'lemon': 1.50, 'lime': 1.50,
      
      // Pantry
      'rice': 2.00, 'pasta': 1.50, 'flour': 1.20, 'sugar': 1.50, 'salt': 0.80,
      'oil': 3.00, 'vinegar': 2.00, 'sauce': 2.50,
      
      // Default
      'default': 2.50
    };

    // Find matching category
    for (const [key, price] of Object.entries(categoryPrices)) {
      if (ingredient_lower.includes(key)) {
        return this.applySupermarketMultiplier(price, supermarket);
      }
    }

    // Use default price
    return this.applySupermarketMultiplier(categoryPrices.default, supermarket);
  }

  private applySupermarketMultiplier(basePrice: number, supermarket: Supermarket): number {
    // Different supermarkets have different price points
    const multipliers: Record<Supermarket, number> = {
      'tesco': 1.0,      // Base price
      'sainsburys': 1.05, // Slightly higher
      'asda': 0.95,      // Slightly lower
      'morrisons': 0.98   // Slightly lower
    };

    return basePrice * (multipliers[supermarket] ?? 1.0);
  }

  private getStoreLocation(supermarket: Supermarket, postcode: string): StoreLocation {
    // Mock store location data - in a real implementation, this would:
    // 1. Use the postcode to get coordinates
    // 2. Find nearest stores of this supermarket
    // 3. Return the closest one within radius
    
    const mockLocations: Record<Supermarket, StoreLocation> = {
      'tesco': {
        name: 'Tesco Superstore',
        address: `Near ${postcode}`,
        distance_miles: Math.random() * 8 + 1 // Random distance 1-9 miles
      },
      'asda': {
        name: 'ASDA Supercentre',
        address: `Near ${postcode}`,
        distance_miles: Math.random() * 8 + 1
      },
      'sainsburys': {
        name: "Sainsbury's Superstore",
        address: `Near ${postcode}`,
        distance_miles: Math.random() * 8 + 1
      },
      'morrisons': {
        name: 'Morrisons Supermarket',
        address: `Near ${postcode}`,
        distance_miles: Math.random() * 8 + 1
      }
    };

    return mockLocations[supermarket];
  }

  private isValidPostcode(postcode: string): boolean {
    // Basic UK postcode validation
    const postcodeRegex = /^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][ABD-HJLNP-UW-Z]{2}$/i;
    return postcodeRegex.test(postcode.trim());
  }

  public async getProductsByCategory(category: string, supermarket?: Supermarket): Promise<any[]> {
    if (supermarket) {
      return this.db.getProductsBySupermarket(supermarket)
        .filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
    }

    const allProducts = [];
    const supermarkets: Supermarket[] = ['tesco', 'asda', 'sainsburys', 'morrisons'];
    
    for (const sm of supermarkets) {
      const products = this.db.getProductsBySupermarket(sm)
        .filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
      allProducts.push(...products);
    }

    return allProducts;
  }

  public async searchProducts(query: string, supermarket?: Supermarket): Promise<any[]> {
    return this.db.searchProducts(query, supermarket);
  }

  public async getRecentPriceChanges(days: number = 7): Promise<any[]> {
    const db = this.db.getDatabase();
    const query = `
      SELECT p.name, p.supermarket, p.price, p.category,
             ph.price as previous_price, ph.recorded_at,
             ROUND(((p.price - ph.price) / ph.price) * 100, 2) as price_change_percent
      FROM products p
      JOIN price_history ph ON p.id = ph.product_id
      WHERE ph.recorded_at >= datetime('now', '-${days} days')
        AND p.price != ph.price
      ORDER BY ABS(price_change_percent) DESC
      LIMIT 50
    `;
    
    return db.prepare(query).all();
  }

  public async getStoreStats(): Promise<Record<Supermarket, { total_products: number, avg_price: number, last_updated: string }>> {
    const db = this.db.getDatabase();
    const stats: any = {};
    const supermarkets: Supermarket[] = ['tesco', 'asda', 'sainsburys', 'morrisons'];

    for (const supermarket of supermarkets) {
      const query = `
        SELECT 
          COUNT(*) as total_products,
          ROUND(AVG(price), 2) as avg_price,
          MAX(last_updated) as last_updated
        FROM products 
        WHERE supermarket = ?
      `;
      
      const result = db.prepare(query).get(supermarket);
      stats[supermarket] = result;
    }

    return stats;
  }

  // Test method for development
  public async testIngredientMatch(ingredient: string, supermarket?: Supermarket): Promise<any> {
    if (supermarket) {
      return await this.matcher.testMatch(ingredient, supermarket);
    }

    const results: any = {};
    const supermarkets: Supermarket[] = ['tesco', 'asda', 'sainsburys', 'morrisons'];
    
    for (const sm of supermarkets) {
      results[sm] = await this.matcher.testMatch(ingredient, sm);
    }

    return results;
  }
} 