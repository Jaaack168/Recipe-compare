export interface Store {
  id: string;
  name: string;
  logoUrl: string;
  distance: number; // in miles
  isOpen: boolean;
  deliveryAvailable: boolean;
  collectionAvailable: boolean;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  placeId?: string;
  rating?: number;
}

export interface StoreAvailability {
  storeId: string;
  available: boolean;
  price: number;
  inStock: boolean;
  estimatedDelivery?: string;
}

export interface IngredientPricing {
  id: number;
  name: string;
  amount: string;
  stores: StoreAvailability[];
}

export interface CartCalculation {
  storeId: string;
  storeName: string;
  totalCost: number;
  availableItems: number;
  missingItems: number;
  missingItemNames: string[];
  isFullyAvailable: boolean;
  isCheapestAvailable: boolean;
}

export interface PostcodeInfo {
  postcode: string;
  latitude: number;
  longitude: number;
  area: string;
  district: string;
}

export interface Recipe {
  id: number;
  title: string;
  image: string;
  time: string;
  price: string;
  rating?: number;
  servings?: number;
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
  mealType?: string;
  tags?: string[];
  available?: boolean;
}

export interface RecipeIngredient {
  id: number;
  name: string;
  amount: string;
  essential?: boolean;
}

export interface RecipeStep {
  id: number;
  instruction: string;
  hasTimer?: boolean;
  timerMinutes?: number;
}

export interface CartItem {
  id: number;
  name: string;
  amount: string;
  price: {
    tesco: number;
    asda: number;
    morrisons: number;
    sainsburys: number;
    aldi: number;
  };
  recipeId: number;
  recipeTitle: string;
  selected: boolean;
  essential?: boolean;
}

export type Supermarket = 'tesco' | 'asda' | 'morrisons' | 'sainsburys' | 'aldi';

export type SupermarketOrAll = Supermarket | 'all';

export const STORE_NAMES: Record<Supermarket, string> = {
  tesco: 'Tesco',
  asda: 'ASDA',
  morrisons: 'Morrisons',
  sainsburys: 'Sainsbury\'s',
  aldi: 'Aldi'
}; 