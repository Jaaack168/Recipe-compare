export interface Product {
  id: string;
  name: string;
  price: number;
  currency: 'GBP';
  availability: 'in_stock' | 'out_of_stock' | 'limited_stock';
  image_url?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  size?: string;
  unit?: string;
  supermarket: Supermarket;
  product_url: string;
  scraped_at: Date;
  last_updated: Date;
}

export type Supermarket = 'tesco' | 'asda' | 'sainsburys' | 'morrisons' | 'aldi' | 'waitrose' | 'marks-spencer';

export interface SupermarketConfig {
  name: string;
  base_url: string;
  search_endpoint: string;
  selectors: {
    product_container: string;
    name: string;
    price: string;
    availability: string;
    image: string;
    category: string;
    product_link: string;
  };
  rate_limit_ms: number;
}

export interface ScrapingResult {
  supermarket: Supermarket;
  products_scraped: number;
  errors: string[];
  duration_ms: number;
  success: boolean;
}

export interface IngredientMatch {
  ingredient: string;
  matches: Array<{
    product: Product;
    confidence: number;
    score: number;
  }>;
}

export interface PriceComparisonRequest {
  ingredients: string[];
  postcode: string;
  radius_miles?: number;
}

export interface PriceComparisonResponse {
  postcode: string;
  stores: Array<{
    supermarket: Supermarket;
    total_cost: number;
    estimated_total: boolean;
    ingredient_matches: IngredientMatch[];
    missing_ingredients: string[];
    store_location?: {
      name: string;
      address: string;
      distance_miles: number;
    };
  }>;
  comparison_timestamp: Date;
}

export interface DatabaseConfig {
  path: string;
  backup_interval_hours: number;
  max_age_days: number;
}

export interface CronJobConfig {
  scraping_schedule: string;
  cleanup_schedule: string;
  backup_schedule: string;
} 