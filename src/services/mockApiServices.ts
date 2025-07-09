import { Store, StoreAvailability, IngredientPricing, CartCalculation, PostcodeInfo, CartItem, Supermarket } from '../types';
import { locationServices } from './locationServices';

// Mock store data
const mockStores: Store[] = [
  {
    id: 'tesco-001',
    name: 'Tesco',
    logoUrl: '/logos/tesco.png',
    distance: 0.5,
    isOpen: true,
    deliveryAvailable: true,
    collectionAvailable: true
  },
  {
    id: 'asda-001',
    name: 'ASDA',
    logoUrl: '/logos/asda.png',
    distance: 0.7,
    isOpen: true,
    deliveryAvailable: true,
    collectionAvailable: true
  },
  {
    id: 'sainsburys-001',
    name: 'Sainsbury\'s',
    logoUrl: '/logos/sainsburys.png',
    distance: 1.2,
    isOpen: true,
    deliveryAvailable: true,
    collectionAvailable: true
  },
  {
    id: 'morrisons-001',
    name: 'Morrisons',
    logoUrl: '/logos/morrisons.png',
    distance: 1.5,
    isOpen: false,
    deliveryAvailable: false,
    collectionAvailable: true
  },
  {
    id: 'aldi-001',
    name: 'Aldi',
    logoUrl: '/logos/aldi.png',
    distance: 2.1,
    isOpen: true,
    deliveryAvailable: false,
    collectionAvailable: true
  }
];

// Mock ingredient availability (simulates some items being out of stock)
const mockIngredientAvailability: Record<string, Record<string, boolean>> = {
  // Ingredient ID -> Store ID -> In Stock
  '101': { 'tesco-001': true, 'asda-001': true, 'sainsburys-001': true, 'morrisons-001': false, 'aldi-001': true },
  '102': { 'tesco-001': true, 'asda-001': false, 'sainsburys-001': true, 'morrisons-001': true, 'aldi-001': true },
  '103': { 'tesco-001': true, 'asda-001': true, 'sainsburys-001': true, 'morrisons-001': true, 'aldi-001': false },
  '201': { 'tesco-001': false, 'asda-001': true, 'sainsburys-001': true, 'morrisons-001': true, 'aldi-001': true },
  '202': { 'tesco-001': true, 'asda-001': true, 'sainsburys-001': false, 'morrisons-001': true, 'aldi-001': true },
  '203': { 'tesco-001': true, 'asda-001': true, 'sainsburys-001': true, 'morrisons-001': true, 'aldi-001': true }
};

// Mock postcode validation
const mockPostcodeData: Record<string, PostcodeInfo> = {
  'SW1A 1AA': {
    postcode: 'SW1A 1AA',
    latitude: 51.5014,
    longitude: -0.1419,
    area: 'London',
    district: 'Westminster'
  },
  'M1 1AA': {
    postcode: 'M1 1AA',
    latitude: 53.4808,
    longitude: -2.2426,
    area: 'Manchester',
    district: 'City Centre'
  },
  'B1 1AA': {
    postcode: 'B1 1AA',
    latitude: 52.4862,
    longitude: -1.8904,
    area: 'Birmingham',
    district: 'City Centre'
  }
};

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApiServices = {
  // Get stores near a postcode
  async getStoresNearPostcode(postcode: string, radius: number = 5): Promise<Store[]> {
    try {
      // Use real location services with Google Places API
      const stores = await locationServices.findStoresNearPostcode(postcode, radius);
      
      if (stores.length > 0) {
        return stores;
      }
      
      // Fallback to mock data if no real stores found
      console.log('No real stores found, falling back to mock data');
      await delay(300); // Simulate API delay
      
      const randomizedStores = mockStores.map(store => ({
        ...store,
        distance: store.distance + (Math.random() - 0.5) * 0.3 // +/- 0.15 miles
      }));
      
      // Filter by radius
      const filteredStores = randomizedStores.filter(store => store.distance <= radius);
      
      return filteredStores.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('Error in getStoresNearPostcode:', error);
      
      // Fallback to mock data on error
      await delay(300);
      const randomizedStores = mockStores.map(store => ({
        ...store,
        distance: store.distance + (Math.random() - 0.5) * 0.3
      }));
      
      const filteredStores = randomizedStores.filter(store => store.distance <= radius);
      return filteredStores.sort((a, b) => a.distance - b.distance);
    }
  },

  // Validate postcode
  async validatePostcode(postcode: string): Promise<PostcodeInfo | null> {
    await delay(300);
    
    const normalizedPostcode = postcode.toUpperCase().replace(/\s+/g, ' ');
    return mockPostcodeData[normalizedPostcode] || null;
  },

  // Get ingredient availability for stores
  async getIngredientAvailability(ingredientId: number, storeIds: string[]): Promise<StoreAvailability[]> {
    await delay(200);
    
    const ingredientKey = ingredientId.toString();
    const availability = mockIngredientAvailability[ingredientKey] || {};
    
    return storeIds.map(storeId => ({
      storeId,
      available: availability[storeId] !== false,
      price: 0, // This would be set by the pricing service
      inStock: availability[storeId] !== false,
      estimatedDelivery: availability[storeId] ? '2-3 hours' : undefined
    }));
  },

  // Calculate cart totals with availability
  async calculateCartTotals(cartItems: CartItem[], stores: Store[]): Promise<CartCalculation[]> {
    await delay(400);
    
    const calculations: CartCalculation[] = [];
    
    for (const store of stores) {
      const storeMapping: Record<string, Supermarket> = {
        'tesco-001': 'tesco',
        'asda-001': 'asda',
        'sainsburys-001': 'sainsburys',
        'morrisons-001': 'morrisons',
        'aldi-001': 'aldi'
      };
      
      const supermarketKey = storeMapping[store.id];
      if (!supermarketKey) continue;
      
      let totalCost = 0;
      let availableItems = 0;
      let missingItems = 0;
      const missingItemNames: string[] = [];
      
      for (const item of cartItems.filter(item => item.selected)) {
        const itemAvailability = mockIngredientAvailability[item.id.toString()];
        const isAvailable = itemAvailability?.[store.id] !== false;
        
        if (isAvailable && store.isOpen) {
          totalCost += item.price[supermarketKey];
          availableItems++;
        } else {
          missingItems++;
          missingItemNames.push(item.name);
        }
      }
      
      const isFullyAvailable = missingItems === 0 && store.isOpen;
      
      calculations.push({
        storeId: store.id,
        storeName: store.name,
        totalCost,
        availableItems,
        missingItems,
        missingItemNames,
        isFullyAvailable,
        isCheapestAvailable: false // Will be set after all calculations
      });
    }
    
    // Mark the cheapest fully available option
    const fullyAvailableOptions = calculations.filter(calc => calc.isFullyAvailable);
    if (fullyAvailableOptions.length > 0) {
      const cheapest = fullyAvailableOptions.reduce((min, calc) => 
        calc.totalCost < min.totalCost ? calc : min
      );
      cheapest.isCheapestAvailable = true;
    }
    
    return calculations.sort((a, b) => {
      // Sort by: fully available first, then by total cost, then by store name
      if (a.isFullyAvailable && !b.isFullyAvailable) return -1;
      if (!a.isFullyAvailable && b.isFullyAvailable) return 1;
      if (a.totalCost !== b.totalCost) return a.totalCost - b.totalCost;
      return a.storeName.localeCompare(b.storeName);
    });
  },

  // Get recipe suggestions based on user preferences and location
  async getRecipeSuggestions(postcode?: string, preferences?: string[]): Promise<any[]> {
    await delay(600);
    
    // Mock personalized suggestions based on location and preferences
    const suggestions = [
      {
        id: 1,
        title: 'Local Favorite: Fish & Chips',
        image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
        time: '25 min',
        price: '£6.50',
        reason: 'Popular in your area',
        availabilityScore: 0.95
      },
      {
        id: 2,
        title: 'Quick Weeknight Pasta',
        image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
        time: '15 min',
        price: '£4.20',
        reason: 'All ingredients available nearby',
        availabilityScore: 1.0
      },
      {
        id: 3,
        title: 'Seasonal Vegetable Curry',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
        time: '30 min',
        price: '£5.80',
        reason: 'Fresh seasonal ingredients',
        availabilityScore: 0.85
      }
    ];
    
    return suggestions;
  }
}; 