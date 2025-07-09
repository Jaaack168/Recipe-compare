export interface CartItem {
  id: string;
  name: string;
  recipeId: string;
  recipeName: string;
  quantity: number;
  store: Store;
  price?: number;
  available: boolean;
}

export interface Store {
  id: string;
  name: string;
  logo?: string;
  deliveryFee: number;
  loyaltyProgram?: string;
  color: string;
}

export interface StoreBreakdown {
  store: Store;
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemsAvailable: number;
  totalItems: number;
  savings?: number;
  comparedTo?: string;
}

export const STORES: Store[] = [
  {
    id: 'tesco',
    name: 'Tesco',
    logo: '🔵',
    deliveryFee: 4.99,
    loyaltyProgram: 'Clubcard',
    color: 'blue'
  },
  {
    id: 'asda',
    name: 'Asda',
    logo: '🟢',
    deliveryFee: 3.99,
    loyaltyProgram: 'Asda Rewards',
    color: 'green'
  },
  {
    id: 'morrisons',
    name: 'Morrisons',
    logo: '🟡',
    deliveryFee: 4.99,
    loyaltyProgram: 'More Card',
    color: 'yellow'
  },
  {
    id: 'sainsburys',
    name: "Sainsbury's",
    logo: '🟠',
    deliveryFee: 4.99,
    loyaltyProgram: 'Nectar',
    color: 'orange'
  },
  {
    id: 'aldi',
    name: 'Aldi',
    logo: '🔷',
    deliveryFee: 4.99,
    loyaltyProgram: '',
    color: 'blue'
  }
];

export const MOCK_CART_ITEMS: CartItem[] = [
  {
    id: '1',
    name: 'Greek Yogurt Protein Bowl',
    recipeId: 'recipe-1',
    recipeName: 'Greek Yogurt Protein Bowl',
    quantity: 1,
    store: STORES[0], // Tesco
    price: undefined,
    available: false
  },
  {
    id: '2',
    name: 'Turkey Meatballs & Veg',
    recipeId: 'recipe-2', 
    recipeName: 'Turkey Meatballs & Veg',
    quantity: 1,
    store: STORES[0], // Tesco
    price: undefined,
    available: false
  },
  {
    id: '3',
    name: 'Lentil & Sweet Potato Curry',
    recipeId: 'recipe-3',
    recipeName: 'Lentil & Sweet Potato Curry', 
    quantity: 1,
    store: STORES[0], // Tesco
    price: undefined,
    available: false
  },
  {
    id: '4',
    name: 'Cauliflower Buffalo Bites',
    recipeId: 'recipe-4',
    recipeName: 'Cauliflower Buffalo Bites',
    quantity: 1,
    store: STORES[0], // Tesco
    price: undefined,
    available: false
  }
];

export const MOCK_STORE_BREAKDOWN: StoreBreakdown[] = [
  {
    store: STORES[0], // Tesco
    subtotal: 0,
    deliveryFee: 4.99,
    total: 4.99,
    itemsAvailable: 0,
    totalItems: 4,
    savings: 8.00,
    comparedTo: 'Aldi'
  },
  {
    store: STORES[1], // Asda  
    subtotal: 0,
    deliveryFee: 3.99,
    total: 3.99,
    itemsAvailable: 0,
    totalItems: 4
  },
  {
    store: STORES[2], // Morrisons
    subtotal: 0,
    deliveryFee: 4.99,
    total: 4.99,
    itemsAvailable: 0,
    totalItems: 4
  },
  {
    store: STORES[3], // Sainsbury's
    subtotal: 0,
    deliveryFee: 4.99,
    total: 4.99,
    itemsAvailable: 0,
    totalItems: 4
  },
  {
    store: STORES[4], // Aldi
    subtotal: 0,
    deliveryFee: 4.99,
    total: 4.99,
    itemsAvailable: 0,
    totalItems: 4
  }
];

export type SortOption = 'lowest-price' | 'best-savings' | 'by-store';
export type ShoppingMode = 'smart-cart' | 'single-store';
export type StoreFilter = 'all' | 'tesco' | 'asda' | 'morrisons' | 'sainsburys' | 'aldi'; 