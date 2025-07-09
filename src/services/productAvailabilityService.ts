import { Store, Supermarket, STORE_NAMES } from '../types';

export interface ProductInfo {
  id: string;
  name: string;
  brand?: string;
  size?: string;
  unit?: string;
}

export interface StoreProductAvailability {
  storeId: string;
  storeName: string;
  available: boolean;
  inStock: boolean;
  price: number;
  originalPrice?: number; // For discount tracking
  discountPercentage?: number;
  productUrl?: string;
  lastUpdated: Date;
  deliverySlots?: string[];
  estimatedDelivery?: string;
}

export interface ProductAvailabilityResult {
  productId: string;
  productName: string;
  stores: StoreProductAvailability[];
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
  availabilityScore: number; // 0-100, percentage of stores with product
}

export interface IngredientMapping {
  ingredientName: string;
  commonNames: string[];
  category: string;
  essential: boolean;
  substitutes?: string[];
}

export class ProductAvailabilityService {
  private static instance: ProductAvailabilityService;
  private cache = new Map<string, ProductAvailabilityResult>();
  private cacheExpiry = new Map<string, Date>();
  private readonly CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  static getInstance(): ProductAvailabilityService {
    if (!ProductAvailabilityService.instance) {
      ProductAvailabilityService.instance = new ProductAvailabilityService();
    }
    return ProductAvailabilityService.instance;
  }

  /**
   * Main method to get product availability across stores
   */
  async getProductAvailability(
    ingredientName: string, 
    stores: Store[], 
    options: {
      includeSubstitutes?: boolean;
      prioritizeOrganic?: boolean;
      maxPriceRange?: number;
    } = {}
  ): Promise<ProductAvailabilityResult> {
    const cacheKey = this.generateCacheKey(ingredientName, stores, options);
    
    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    // Map ingredient to searchable product terms
    const productMapping = this.mapIngredientToProducts(ingredientName);
    
    // Get availability from each store
    const storeAvailabilities: StoreProductAvailability[] = [];
    
    for (const store of stores) {
      try {
        const availability = await this.getStoreProductAvailability(
          store, 
          productMapping, 
          options
        );
        storeAvailabilities.push(availability);
      } catch (error) {
        console.error(`Error getting availability for ${store.name}:`, error);
        // Add unavailable entry for this store
        storeAvailabilities.push({
          storeId: store.id,
          storeName: store.name,
          available: false,
          inStock: false,
          price: 0,
          lastUpdated: new Date()
        });
      }
    }

    // Calculate aggregate metrics
    const result = this.calculateAggregateMetrics(ingredientName, storeAvailabilities);
    
    // Cache the result
    this.cacheResult(cacheKey, result);
    
    return result;
  }

  /**
   * Get availability for a specific store
   */
  private async getStoreProductAvailability(
    store: Store, 
    productMapping: IngredientMapping,
    options: any
  ): Promise<StoreProductAvailability> {
    const storeChain = this.extractStoreChain(store.name);
    
    // Try different methods in order of preference
    try {
             // 1. Try official store API (if available)
       const apiResult = await this.tryStoreAPI(storeChain, productMapping, options);
       if (apiResult) {
         return {
           storeId: store.id,
           storeName: store.name,
           available: apiResult.available ?? false,
           inStock: apiResult.inStock ?? false,
           price: apiResult.price ?? 0,
           originalPrice: apiResult.originalPrice,
           discountPercentage: apiResult.discountPercentage,
           productUrl: apiResult.productUrl,
           deliverySlots: apiResult.deliverySlots,
           estimatedDelivery: apiResult.estimatedDelivery,
           lastUpdated: new Date()
         };
       }
    } catch (error) {
      console.log(`Store API failed for ${store.name}, trying next method`);
    }

    try {
             // 2. Try web scraping (with rate limiting)
       const scrapedResult = await this.tryWebScraping(storeChain, productMapping, options);
       if (scrapedResult) {
         return {
           storeId: store.id,
           storeName: store.name,
           available: scrapedResult.available ?? false,
           inStock: scrapedResult.inStock ?? false,
           price: scrapedResult.price ?? 0,
           originalPrice: scrapedResult.originalPrice,
           discountPercentage: scrapedResult.discountPercentage,
           productUrl: scrapedResult.productUrl,
           deliverySlots: scrapedResult.deliverySlots,
           estimatedDelivery: scrapedResult.estimatedDelivery,
           lastUpdated: new Date()
         };
       }
    } catch (error) {
      console.log(`Web scraping failed for ${store.name}, using mock data`);
    }

    // 3. Fallback to enhanced mock data
    return this.getMockProductAvailability(store, productMapping, options);
  }

  /**
   * Map ingredient name to product search terms
   */
  private mapIngredientToProducts(ingredientName: string): IngredientMapping {
    const name = ingredientName.toLowerCase().trim();
    
    // Common ingredient mappings
    const commonMappings: Record<string, IngredientMapping> = {
      'chicken breast': {
        ingredientName: 'chicken breast',
        commonNames: ['chicken breast', 'chicken breast fillets', 'skinless chicken breast', 'chicken breast portions'],
        category: 'meat',
        essential: true,
        substitutes: ['chicken thigh', 'turkey breast']
      },
      'onion': {
        ingredientName: 'onion',
        commonNames: ['onions', 'brown onions', 'yellow onions', 'cooking onions'],
        category: 'vegetables',
        essential: true,
        substitutes: ['shallots', 'spring onions']
      },
      'tomatoes': {
        ingredientName: 'tomatoes',
        commonNames: ['tomatoes', 'fresh tomatoes', 'vine tomatoes', 'cherry tomatoes'],
        category: 'vegetables',
        essential: true,
        substitutes: ['canned tomatoes', 'passata']
      },
      'olive oil': {
        ingredientName: 'olive oil',
        commonNames: ['olive oil', 'extra virgin olive oil', 'cooking olive oil'],
        category: 'oils',
        essential: true,
        substitutes: ['vegetable oil', 'sunflower oil']
      },
      'garlic': {
        ingredientName: 'garlic',
        commonNames: ['garlic', 'garlic cloves', 'fresh garlic', 'garlic bulb'],
        category: 'vegetables',
        essential: true,
        substitutes: ['garlic powder', 'garlic paste']
      },
      'rice': {
        ingredientName: 'rice',
        commonNames: ['rice', 'long grain rice', 'basmati rice', 'jasmine rice'],
        category: 'grains',
        essential: true,
        substitutes: ['quinoa', 'couscous']
      }
    };

    // Return exact match or create generic mapping
    return commonMappings[name] || {
      ingredientName: name,
      commonNames: [name, `fresh ${name}`, `organic ${name}`],
      category: 'general',
      essential: false,
      substitutes: []
    };
  }

  /**
   * Try to use official store APIs
   */
  private async tryStoreAPI(
    storeChain: string, 
    productMapping: IngredientMapping,
    options: any
  ): Promise<Partial<StoreProductAvailability> | null> {
    // For now, this is a placeholder for future API integrations
    // Each store would need specific API implementation
    
    switch (storeChain) {
      case 'tesco':
        return this.tryTescoAPI(productMapping, options);
      case 'sainsburys':
        return this.trySainsburysAPI(productMapping, options);
      default:
        return null;
    }
  }

  /**
   * Placeholder for Tesco API integration
   */
  private async tryTescoAPI(
    productMapping: IngredientMapping,
    options: any
  ): Promise<Partial<StoreProductAvailability> | null> {
    // This would integrate with Tesco's developer API if available
    // For now, return null to fall back to other methods
    return null;
  }

  /**
   * Placeholder for Sainsbury's API integration
   */
  private async trySainsburysAPI(
    productMapping: IngredientMapping,
    options: any
  ): Promise<Partial<StoreProductAvailability> | null> {
    // This would integrate with Sainsbury's API if available
    return null;
  }

  /**
   * Try web scraping (with ethical considerations and rate limiting)
   */
  private async tryWebScraping(
    storeChain: string,
    productMapping: IngredientMapping,
    options: any
  ): Promise<Partial<StoreProductAvailability> | null> {
    // Note: Web scraping should be done ethically and with respect to terms of service
    // This is a placeholder that would need careful implementation
    
    // Add delay to be respectful to servers
    await this.delay(1000 + Math.random() * 2000);
    
    // For demonstration, return null to fall back to mock data
    // Real implementation would need:
    // 1. Respect robots.txt
    // 2. Rate limiting
    // 3. User agent headers
    // 4. Handle anti-bot measures
    // 5. Parse product data carefully
    
    return null;
  }

  /**
   * Generate realistic mock data based on store and product
   */
  private getMockProductAvailability(
    store: Store,
    productMapping: IngredientMapping,
    options: any
  ): StoreProductAvailability {
    const storeChain = this.extractStoreChain(store.name);
    
    // Realistic price ranges by store and category
    const priceRanges = this.getPriceRange(storeChain, productMapping.category);
    const basePrice = priceRanges.min + Math.random() * (priceRanges.max - priceRanges.min);
    
    // Store-specific availability patterns
    const availability = this.getStoreAvailabilityPattern(storeChain, productMapping);
    
    // Add some realism with occasional out-of-stock items
    const inStock = Math.random() > 0.1; // 90% chance of being in stock
    
    return {
      storeId: store.id,
      storeName: store.name,
      available: availability.available,
      inStock: inStock && availability.available,
      price: Math.round(basePrice * 100) / 100, // Round to 2 decimal places
      originalPrice: Math.random() > 0.7 ? Math.round(basePrice * 1.2 * 100) / 100 : undefined,
      discountPercentage: Math.random() > 0.7 ? Math.round(Math.random() * 20) : undefined,
      lastUpdated: new Date(),
      estimatedDelivery: store.deliveryAvailable ? this.getEstimatedDelivery(storeChain) : undefined
    };
  }

  /**
   * Get realistic price ranges by store and category
   */
  private getPriceRange(storeChain: string, category: string): { min: number; max: number } {
    const basePrices: Record<string, Record<string, { min: number; max: number }>> = {
      'meat': {
        'tesco': { min: 3.50, max: 8.00 },
        'sainsburys': { min: 3.80, max: 8.50 },
        'asda': { min: 3.20, max: 7.50 },
        'morrisons': { min: 3.40, max: 7.80 },
        'aldi': { min: 2.80, max: 6.50 },
        'waitrose': { min: 5.20, max: 12.00 },
        'marks-spencer': { min: 4.80, max: 11.50 }
      },
      'vegetables': {
        'tesco': { min: 0.80, max: 3.00 },
        'sainsburys': { min: 0.90, max: 3.20 },
        'asda': { min: 0.70, max: 2.80 },
        'morrisons': { min: 0.75, max: 2.90 },
        'aldi': { min: 0.60, max: 2.50 },
        'waitrose': { min: 1.20, max: 4.50 },
        'marks-spencer': { min: 1.10, max: 4.20 }
      },
      'oils': {
        'tesco': { min: 1.50, max: 5.00 },
        'sainsburys': { min: 1.60, max: 5.50 },
        'asda': { min: 1.40, max: 4.80 },
        'morrisons': { min: 1.45, max: 4.90 },
        'aldi': { min: 1.20, max: 4.20 },
        'waitrose': { min: 2.50, max: 8.50 },
        'marks-spencer': { min: 2.20, max: 7.80 }
      },
      'grains': {
        'tesco': { min: 1.00, max: 4.00 },
        'sainsburys': { min: 1.10, max: 4.20 },
        'asda': { min: 0.90, max: 3.80 },
        'morrisons': { min: 0.95, max: 3.90 },
        'aldi': { min: 0.80, max: 3.50 },
        'waitrose': { min: 1.60, max: 6.50 },
        'marks-spencer': { min: 1.45, max: 6.00 }
      }
    };

    return basePrices[category]?.[storeChain] || { min: 1.00, max: 5.00 };
  }

  /**
   * Get store-specific availability patterns
   */
  private getStoreAvailabilityPattern(storeChain: string, productMapping: IngredientMapping) {
    // Different stores have different product range strengths
    const storeStrengths: Record<string, string[]> = {
      'tesco': ['general', 'meat', 'vegetables', 'grains'],
      'sainsburys': ['general', 'meat', 'vegetables', 'organic'],
      'asda': ['general', 'meat', 'grains'],
      'morrisons': ['meat', 'vegetables', 'grains'],
      'aldi': ['general', 'grains']
    };

    const strengths = storeStrengths[storeChain] || ['general'];
    const hasStrength = strengths.includes(productMapping.category) || strengths.includes('general');
    
    return {
      available: hasStrength ? Math.random() > 0.05 : Math.random() > 0.3, // 95% vs 70% availability
    };
  }

  /**
   * Get estimated delivery times by store
   */
  private getEstimatedDelivery(storeChain: string): string {
    const deliveryTimes: Record<string, string[]> = {
      'tesco': ['Same day', '1-2 hours', 'Next day'],
      'sainsburys': ['Same day', '2-3 hours', 'Next day'],
      'asda': ['2-4 hours', 'Next day', '2-3 days'],
      'morrisons': ['3-5 hours', 'Next day', '2-3 days'],
      'aldi': [], // No delivery
      'iceland': ['Same day', '1-2 hours']
    };

    const options = deliveryTimes[storeChain] || ['Next day'];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Extract store chain from store name
   */
  private extractStoreChain(storeName: string): string {
    const name = storeName.toLowerCase();
    if (name.includes('tesco')) return 'tesco';
    if (name.includes('sainsbury')) return 'sainsburys';
    if (name.includes('asda')) return 'asda';
    if (name.includes('morrisons')) return 'morrisons';
    if (name.includes('aldi')) return 'aldi';
    if (name.includes('lidl')) return 'lidl';
    if (name.includes('iceland')) return 'iceland';
    if (name.includes('waitrose')) return 'waitrose';
    if (name.includes('marks') || name.includes('m&s')) return 'marks-spencer';
    if (name.includes('co-op') || name.includes('coop')) return 'coop';
    return 'unknown';
  }

  /**
   * Calculate aggregate metrics across all stores
   */
  private calculateAggregateMetrics(
    productName: string,
    storeAvailabilities: StoreProductAvailability[]
  ): ProductAvailabilityResult {
    const availableStores = storeAvailabilities.filter(s => s.available && s.inStock);
    const prices = availableStores.map(s => s.price).filter(p => p > 0);

    return {
      productId: this.generateProductId(productName),
      productName,
      stores: storeAvailabilities,
      averagePrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      lowestPrice: prices.length > 0 ? Math.min(...prices) : 0,
      highestPrice: prices.length > 0 ? Math.max(...prices) : 0,
      availabilityScore: Math.round((availableStores.length / storeAvailabilities.length) * 100)
    };
  }

  /**
   * Cache management
   */
  private generateCacheKey(ingredientName: string, stores: Store[], options: any): string {
    const storeIds = stores.map(s => s.id).sort().join(',');
    const optionsStr = JSON.stringify(options);
    return `${ingredientName}-${storeIds}-${optionsStr}`;
  }

  private getCachedResult(cacheKey: string): ProductAvailabilityResult | null {
    const expiry = this.cacheExpiry.get(cacheKey);
    if (expiry && expiry > new Date()) {
      return this.cache.get(cacheKey) || null;
    }
    
    // Clean up expired cache entry
    this.cache.delete(cacheKey);
    this.cacheExpiry.delete(cacheKey);
    return null;
  }

  private cacheResult(cacheKey: string, result: ProductAvailabilityResult): void {
    this.cache.set(cacheKey, result);
    this.cacheExpiry.set(cacheKey, new Date(Date.now() + this.CACHE_DURATION_MS));
  }

  private generateProductId(productName: string): string {
    return `product-${productName.toLowerCase().replace(/\s+/g, '-')}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Bulk check availability for multiple ingredients
   */
  async checkMultipleIngredients(
    ingredients: string[],
    stores: Store[],
    options: any = {}
  ): Promise<ProductAvailabilityResult[]> {
    const results = await Promise.allSettled(
      ingredients.map(ingredient => 
        this.getProductAvailability(ingredient, stores, options)
      )
    );

    return results
      .filter((result): result is PromiseFulfilledResult<ProductAvailabilityResult> => 
        result.status === 'fulfilled')
      .map(result => result.value);
  }

  /**
   * Get ingredient substitution suggestions
   */
  getIngredientSubstitutes(ingredientName: string): string[] {
    const mapping = this.mapIngredientToProducts(ingredientName);
    return mapping.substitutes || [];
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

// Export singleton instance
export const productAvailabilityService = ProductAvailabilityService.getInstance(); 