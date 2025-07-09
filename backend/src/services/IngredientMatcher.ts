import Fuse from 'fuse.js';
import { Product, IngredientMatch, Supermarket } from '../types/index.js';
import { DatabaseService } from '../database/connection.js';

interface FuseProduct extends Product {
  searchableText: string;
}

export class IngredientMatcher {
  private db: DatabaseService;
  private fuseInstances: Map<Supermarket, Fuse<FuseProduct>> = new Map();
  private lastIndexUpdate: Map<Supermarket, Date> = new Map();
  private readonly CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  public async matchIngredients(
    ingredients: string[], 
    supermarkets: Supermarket[] = ['tesco', 'asda', 'sainsburys', 'morrisons']
  ): Promise<Record<Supermarket, IngredientMatch[]>> {
    const results: Record<Supermarket, IngredientMatch[]> = {} as any;

    for (const supermarket of supermarkets) {
      try {
        results[supermarket] = await this.matchIngredientsForSupermarket(ingredients, supermarket);
      } catch (error) {
        console.error(`Error matching ingredients for ${supermarket}:`, error);
        results[supermarket] = [];
      }
    }

    return results;
  }

  public async matchIngredientsForSupermarket(
    ingredients: string[], 
    supermarket: Supermarket
  ): Promise<IngredientMatch[]> {
    await this.ensureIndexUpdated(supermarket);
    const fuse = this.fuseInstances.get(supermarket);

    if (!fuse) {
      throw new Error(`No search index available for ${supermarket}`);
    }

    const matches: IngredientMatch[] = [];

    for (const ingredient of ingredients) {
      // Skip null or undefined ingredients
      if (!ingredient || typeof ingredient !== 'string') {
        console.warn(`Skipping invalid ingredient:`, ingredient);
        matches.push({
          ingredient: ingredient || 'Unknown',
          matches: []
        });
        continue;
      }

      try {
        // Check cache first
        const cachedMatches = this.db.getCachedMatches(ingredient, supermarket);
        if (cachedMatches.length > 0) {
          const match: IngredientMatch = {
            ingredient,
            matches: cachedMatches.map(cached => ({
              product: {
                id: cached.product_id,
                name: cached.name,
                price: cached.price,
                currency: 'GBP' as const,
                availability: cached.availability,
                image_url: cached.image_url,
                category: cached.category,
                supermarket,
                product_url: '',
                scraped_at: new Date(),
                last_updated: new Date()
              },
              confidence: cached.confidence,
              score: cached.score
            }))
          };
          matches.push(match);
          continue;
        }

        // Perform fuzzy search
        const searchResults = this.searchIngredient(fuse, ingredient);
        
        if (searchResults.length > 0) {
          const match: IngredientMatch = {
            ingredient,
            matches: searchResults.map(result => ({
              product: result.item,
              confidence: this.calculateConfidence(result.score || 0),
              score: result.score || 0
            }))
          };

          matches.push(match);

          // Cache the results
          for (const result of searchResults) {
            this.db.cacheIngredientMatch(
              ingredient,
              result.item.id,
              this.calculateConfidence(result.score || 0),
              result.score || 0,
              supermarket
            );
          }
        } else {
          // No matches found
          matches.push({
            ingredient,
            matches: []
          });
        }
      } catch (error) {
        console.error(`Error matching ingredient "${ingredient}":`, error);
        matches.push({
          ingredient,
          matches: []
        });
      }
    }

    return matches;
  }

  private searchIngredient(fuse: Fuse<FuseProduct>, ingredient: string): Fuse.FuseResult<FuseProduct>[] {
    // Clean and normalize ingredient name
    const cleanIngredient = this.normalizeIngredient(ingredient);
    
    // Search with multiple strategies
    const searches = [
      fuse.search(cleanIngredient, { limit: 5 }),
      fuse.search(ingredient, { limit: 3 }),
      // Try searching without common words
      fuse.search(this.removeCommonWords(cleanIngredient), { limit: 3 })
    ];

    // Combine and deduplicate results
    const allResults = searches.flat();
    const uniqueResults = this.deduplicateResults(allResults);

    // Sort by relevance score and return top 10
    return uniqueResults
      .sort((a, b) => (a.score || 0) - (b.score || 0))
      .slice(0, 10);
  }

  private normalizeIngredient(ingredient: string): string {
    if (!ingredient || typeof ingredient !== 'string') {
      return '';
    }
    return ingredient
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\b(fresh|organic|free.range|extra|large|small|medium|chopped|diced|sliced)\b/gi, '') // Remove common descriptors
      .trim();
  }

  private removeCommonWords(ingredient: string): string {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'of', 'with', 'in', 'for', 'to'];
    return ingredient
      .split(' ')
      .filter(word => !commonWords.includes(word.toLowerCase()))
      .join(' ');
  }

  private deduplicateResults(results: Fuse.FuseResult<FuseProduct>[]): Fuse.FuseResult<FuseProduct>[] {
    const seen = new Set<string>();
    return results.filter(result => {
      if (seen.has(result.item.id)) {
        return false;
      }
      seen.add(result.item.id);
      return true;
    });
  }

  private calculateConfidence(score: number): number {
    // Convert Fuse.js score (lower is better) to confidence (higher is better)
    // Fuse.js scores range from 0 (perfect match) to 1 (no match)
    if (score <= 0.1) return 0.95; // Excellent match
    if (score <= 0.2) return 0.85; // Very good match
    if (score <= 0.3) return 0.75; // Good match
    if (score <= 0.4) return 0.65; // Fair match
    if (score <= 0.5) return 0.55; // Poor match
    return 0.45; // Very poor match
  }

  private async ensureIndexUpdated(supermarket: Supermarket): Promise<void> {
    const lastUpdate = this.lastIndexUpdate.get(supermarket);
    const now = new Date();

    if (!lastUpdate || (now.getTime() - lastUpdate.getTime()) > this.CACHE_DURATION_MS) {
      await this.updateSearchIndex(supermarket);
      this.lastIndexUpdate.set(supermarket, now);
    }
  }

  private async updateSearchIndex(supermarket: Supermarket): Promise<void> {
    try {
      console.log(`Updating search index for ${supermarket}`);
      
      const products = this.db.getProductsBySupermarket(supermarket);
      const fuseProducts: FuseProduct[] = products.map(product => ({
        ...product,
        searchableText: this.createSearchableText(product)
      }));

      const fuseOptions: Fuse.IFuseOptions<FuseProduct> = {
        keys: [
          { name: 'name', weight: 0.7 },
          { name: 'searchableText', weight: 0.5 },
          { name: 'category', weight: 0.3 },
          { name: 'brand', weight: 0.2 }
        ],
        threshold: 0.6, // More lenient matching
        distance: 100,
        minMatchCharLength: 2,
        includeScore: true,
        includeMatches: false,
        shouldSort: true,
        getFn: (obj: any, path: string) => {
          return obj[path] || '';
        }
      };

      const fuse = new Fuse(fuseProducts, fuseOptions);
      this.fuseInstances.set(supermarket, fuse);
      
      console.log(`Search index updated for ${supermarket} with ${fuseProducts.length} products`);
    } catch (error) {
      console.error(`Failed to update search index for ${supermarket}:`, error);
      throw error;
    }
  }

  private createSearchableText(product: any): string {
    const parts = [
      product.name,
      product.category,
      product.subcategory,
      product.brand,
      product.size,
      product.unit
    ].filter(Boolean);

    return parts.join(' ').toLowerCase();
  }

  public async refreshAllIndexes(): Promise<void> {
    const supermarkets: Supermarket[] = ['tesco', 'asda', 'sainsburys', 'morrisons'];
    
    for (const supermarket of supermarkets) {
      try {
        await this.updateSearchIndex(supermarket);
        this.lastIndexUpdate.set(supermarket, new Date());
      } catch (error) {
        console.error(`Failed to refresh index for ${supermarket}:`, error);
      }
    }
  }

  public getIndexStats(): Record<Supermarket, { products: number, lastUpdate: Date | null }> {
    const stats: any = {};
    const supermarkets: Supermarket[] = ['tesco', 'asda', 'sainsburys', 'morrisons'];

    for (const supermarket of supermarkets) {
      const fuse = this.fuseInstances.get(supermarket);
      stats[supermarket] = {
        products: fuse ? fuse.getIndex().size : 0,
        lastUpdate: this.lastIndexUpdate.get(supermarket) || null
      };
    }

    return stats;
  }

  // Helper method for testing specific matches
  public async testMatch(ingredient: string, supermarket: Supermarket): Promise<IngredientMatch> {
    const matches = await this.matchIngredientsForSupermarket([ingredient], supermarket);
    return matches[0] || { ingredient, matches: [] };
  }
} 