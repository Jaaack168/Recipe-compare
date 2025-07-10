import { StoreFilter } from '../data/mockCartData';

export interface IngredientPrice {
  name: string;
  prices: {
    tesco: number;
    asda: number;
    morrisons: number;
    sainsburys: number;
    aldi: number;
    waitrose: number;
    'marks-spencer': number;
  };
}

// Mock ingredient pricing data based on realistic UK supermarket prices
export const INGREDIENT_PRICING: Record<string, IngredientPrice> = {
  'Greek Yogurt Protein Bowl': {
    name: 'Greek Yogurt Protein Bowl',
    prices: {
      tesco: 26.70,      // Sum of individual ingredients at Tesco
      asda: 25.55,       // Sum of individual ingredients at ASDA  
      morrisons: 27.20,   // Sum of individual ingredients at Morrisons
      sainsburys: 27.80,  // Sum of individual ingredients at Sainsbury's
      aldi: 23.95,       // Sum of individual ingredients at Aldi (budget)
      waitrose: 36.90,   // Sum of individual ingredients at Waitrose (premium)
      'marks-spencer': 35.40 // Sum of individual ingredients at M&S (premium)
    }
  },
  'Turkey Meatballs & Veg': {
    name: 'Turkey Meatballs & Veg',
    prices: {
      tesco: 21.50,
      asda: 20.15,
      morrisons: 21.80,
      sainsburys: 22.40,
      aldi: 18.90,
      waitrose: 30.25,
      'marks-spencer': 28.60
    }
  },
  'Lentil & Sweet Potato Curry': {
    name: 'Lentil & Sweet Potato Curry',
    prices: {
      tesco: 16.80,
      asda: 15.50,
      morrisons: 17.20,
      sainsburys: 17.90,
      aldi: 14.25,
      waitrose: 24.15,
      'marks-spencer': 22.70
    }
  },
  'Cauliflower Buffalo Bites': {
    name: 'Cauliflower Buffalo Bites',
    prices: {
      tesco: 13.40,
      asda: 12.50,
      morrisons: 13.80,
      sainsburys: 14.20,
      aldi: 11.65,
      waitrose: 19.95,
      'marks-spencer': 18.70
    }
  }
};

export interface PriceCalculationOptions {
  selectedStore: StoreFilter;
  shoppingMode: 'single-store';
  quantity?: number;
}

export class PriceCalculator {
  /**
   * Calculate the price for a recipe based on store selection and shopping mode
   */
  static calculateRecipePrice(
    recipeName: string, 
    options: PriceCalculationOptions
  ): number {
    const ingredientData = INGREDIENT_PRICING[recipeName];
    if (!ingredientData) {
      return 0; // Return 0 for unknown recipes
    }

    const quantity = options.quantity || 1;

    // Single store mode: use selected store price
    if (options.selectedStore === 'all') {
      // If 'all' is selected, show average price
      const prices = Object.values(ingredientData.prices);
      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      return averagePrice * quantity;
    } else {
      // Specific store selected
      const storePrice = ingredientData.prices[options.selectedStore as keyof typeof ingredientData.prices];
      return (storePrice || 0) * quantity;
    }
  }

  /**
   * Calculate total cart cost with optional loyalty savings
   */
  static calculateTotal(
    cartItems: Array<{ recipeName: string; quantity: number }>,
    options: { 
      selectedStore: StoreFilter;
      shoppingMode: 'single-store';
      applyLoyalty?: boolean;
    }
  ): number {
    const subtotal = cartItems.reduce((sum, item) => {
      const itemPrice = this.calculateRecipePrice(item.recipeName, {
        selectedStore: options.selectedStore,
        shoppingMode: options.shoppingMode,
        quantity: item.quantity
      });
      return sum + itemPrice;
    }, 0);

    // Apply loyalty savings (typically 5-10% discount for loyalty members)
    if (options.applyLoyalty && options.selectedStore !== 'all') {
      const loyaltyDiscount = this.getLoyaltyDiscount(options.selectedStore);
      return subtotal * (1 - loyaltyDiscount);
    }

    return subtotal;
  }

  /**
   * Get the most expensive store total for comparison
   */
  static getMostExpensiveStoreTotal(
    cartItems: Array<{ recipeName: string; quantity: number }>
  ): number {
    const storeIds: (keyof typeof INGREDIENT_PRICING[string]['prices'])[] = [
      'tesco', 'asda', 'morrisons', 'sainsburys', 'aldi', 'waitrose', 'marks-spencer'
    ];

    let maxTotal = 0;

    for (const storeId of storeIds) {
      const storeTotal = cartItems.reduce((sum, item) => {
        const itemPrice = this.calculateRecipePrice(item.recipeName, {
          selectedStore: storeId as StoreFilter,
          shoppingMode: 'single-store',
          quantity: item.quantity
        });
        return sum + itemPrice;
      }, 0);

      if (storeTotal > maxTotal) {
        maxTotal = storeTotal;
      }
    }

    return maxTotal;
  }

  /**
   * Get loyalty discount percentage for a store
   */
  static getLoyaltyDiscount(storeId: StoreFilter): number {
    const loyaltyDiscounts: Record<string, number> = {
      'tesco': 0.05,        // 5% Clubcard discount
      'asda': 0.03,         // 3% Asda Rewards
      'morrisons': 0.04,    // 4% More Card
      'sainsburys': 0.06,   // 6% Nectar discount
      'aldi': 0.00,         // No loyalty scheme
      'waitrose': 0.08,     // 8% myWaitrose premium discount
      'marks-spencer': 0.07 // 7% Sparks discount
    };

    return loyaltyDiscounts[storeId] || 0;
  }

  /**
   * Get loyalty scheme name for a store
   */
  static getLoyaltySchemeName(storeId: StoreFilter): string {
    const loyaltySchemes: Record<string, string> = {
      'tesco': 'Clubcard',
      'asda': 'Asda Rewards',
      'morrisons': 'More Card',
      'sainsburys': 'Nectar',
      'aldi': '',
      'waitrose': 'myWaitrose',
      'marks-spencer': 'Sparks'
    };

    return loyaltySchemes[storeId] || '';
  }

  /**
   * Get the cheapest store for a specific recipe
   */
  static getCheapestStoreForRecipe(recipeName: string): string | null {
    const ingredientData = INGREDIENT_PRICING[recipeName];
    if (!ingredientData) return null;

    const prices = ingredientData.prices;
    let cheapestStore = '';
    let cheapestPrice = Infinity;

    for (const [store, price] of Object.entries(prices)) {
      if (price < cheapestPrice) {
        cheapestPrice = price;
        cheapestStore = store;
      }
    }

    return cheapestStore;
  }

  /**
   * Calculate savings compared to most expensive option
   */
  static calculateSavings(
    recipeName: string,
    selectedStore: StoreFilter,
    quantity: number = 1
  ): number {
    const ingredientData = INGREDIENT_PRICING[recipeName];
    if (!ingredientData) return 0;

    const prices = Object.values(ingredientData.prices);
    const maxPrice = Math.max(...prices);
    
    let currentPrice = 0;
    if (selectedStore === 'all') {
      currentPrice = Math.min(...prices); // Use cheapest when 'all' selected
    } else {
      currentPrice = ingredientData.prices[selectedStore as keyof typeof ingredientData.prices] || 0;
    }

    const savings = (maxPrice - currentPrice) * quantity;
    return Math.max(0, savings);
  }

  /**
   * Get price comparison data for all stores for a recipe
   */
  static getPriceComparison(recipeName: string): Array<{store: string, price: number, savings: number}> {
    const ingredientData = INGREDIENT_PRICING[recipeName];
    if (!ingredientData) return [];

    const prices = ingredientData.prices;
    const maxPrice = Math.max(...Object.values(prices));

    return Object.entries(prices).map(([store, price]) => ({
      store,
      price,
      savings: maxPrice - price
    })).sort((a, b) => a.price - b.price); // Sort by price ascending
  }

  /**
   * Generate store breakdown data for all stores with current cart
   */
  static generateStoreBreakdown(
    cartItems: Array<{ recipeName: string; quantity: number }>
  ): Array<{
    store: {
      id: string;
      name: string;
      loyaltyProgram?: string;
      color: string;
    };
    subtotal: number;
    total: number;
    itemsAvailable: number;
    totalItems: number;
  }> {
    const stores = [
      { id: 'tesco', name: 'Tesco', loyaltyProgram: 'Clubcard', color: 'blue' },
      { id: 'asda', name: 'Asda', loyaltyProgram: 'Asda Rewards', color: 'green' },
      { id: 'morrisons', name: 'Morrisons', loyaltyProgram: 'More Card', color: 'yellow' },
      { id: 'sainsburys', name: "Sainsbury's", loyaltyProgram: 'Nectar', color: 'orange' },
      { id: 'aldi', name: 'Aldi', loyaltyProgram: '', color: 'blue' },
      { id: 'waitrose', name: 'Waitrose', loyaltyProgram: 'myWaitrose', color: 'emerald' },
      { id: 'marks-spencer', name: 'M&S', loyaltyProgram: 'Sparks', color: 'purple' }
    ];

    return stores.map(store => {
      // Calculate subtotal (without loyalty)
      const subtotal = this.calculateTotal(cartItems, {
        selectedStore: store.id as StoreFilter,
        shoppingMode: 'single-store',
        applyLoyalty: false
      });

      // Calculate total (with loyalty)
      const total = this.calculateTotal(cartItems, {
        selectedStore: store.id as StoreFilter,
        shoppingMode: 'single-store',
        applyLoyalty: true
      });

      // Count available items (all items are available for all stores in our mock data)
      const itemsAvailable = cartItems.length;
      const totalItems = cartItems.length;

      return {
        store,
        subtotal,
        total,
        itemsAvailable,
        totalItems
      };
    });
  }
} 