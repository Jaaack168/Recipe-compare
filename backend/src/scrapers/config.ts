import { SupermarketConfig } from '../types/index.js';

export const supermarketConfigs: Record<string, SupermarketConfig> = {
  tesco: {
    name: 'Tesco',
    base_url: 'https://www.tesco.com',
    search_endpoint: 'https://www.tesco.com/groceries/en-GB/search?query={query}&page={page}',
    selectors: {
      product_container: '[data-auto="product-tile"]',
      name: '[data-auto="product-tile--title"]',
      price: '[data-auto="price-details"]',
      availability: '[data-auto="product-tile--availability"]',
      image: '[data-auto="product-tile--image"] img',
      category: '[data-auto="breadcrumbs"] a',
      product_link: 'a[data-auto="product-tile--link"]'
    },
    rate_limit_ms: 2000
  },
  asda: {
    name: 'ASDA',
    base_url: 'https://groceries.asda.com',
    search_endpoint: 'https://groceries.asda.com/search/{query}?page={page}',
    selectors: {
      product_container: '[data-auto-id="pod"]',
      name: '[data-auto-id="pod-link"] h3',
      price: '[data-auto-id="pod-price"]',
      availability: '[data-auto-id="pod-availability"]',
      image: '[data-auto-id="pod-image"] img',
      category: '.breadcrumb a',
      product_link: '[data-auto-id="pod-link"]'
    },
    rate_limit_ms: 2500
  },
  sainsburys: {
    name: "Sainsbury's",
    base_url: 'https://www.sainsburys.co.uk',
    search_endpoint: 'https://www.sainsburys.co.uk/gol-ui/SearchResults/{query}/{page}',
    selectors: {
      product_container: '[data-test-id="product-tile"]',
      name: '[data-test-id="product-tile-description"] a',
      price: '[data-test-id="product-tile-price"]',
      availability: '[data-test-id="product-tile-availability"]',
      image: '[data-test-id="product-tile-image"] img',
      category: '[data-test-id="breadcrumb"] a',
      product_link: '[data-test-id="product-tile-description"] a'
    },
    rate_limit_ms: 3000
  },
  morrisons: {
    name: 'Morrisons',
    base_url: 'https://groceries.morrisons.com',
    search_endpoint: 'https://groceries.morrisons.com/search?entry={query}&page={page}',
    selectors: {
      product_container: '.fops-item',
      name: '.fops-item-details h4 a',
      price: '.fops-price',
      availability: '.fops-availability',
      image: '.fops-item-image img',
      category: '.breadcrumb a',
      product_link: '.fops-item-details h4 a'
    },
    rate_limit_ms: 2000
  }
};

export const commonSearchTerms = [
  // Basic ingredients
  'milk', 'bread', 'eggs', 'butter', 'cheese', 'flour', 'sugar', 'salt', 'pepper',
  'olive oil', 'vegetable oil', 'onions', 'garlic', 'tomatoes', 'potatoes', 'carrots',
  'chicken', 'beef', 'pork', 'fish', 'salmon', 'rice', 'pasta', 'lentils', 'beans',
  
  // Dairy & alternatives
  'yogurt', 'cream', 'cottage cheese', 'cheddar', 'mozzarella', 'parmesan',
  'almond milk', 'oat milk', 'soy milk', 'coconut milk',
  
  // Fruits & vegetables
  'apples', 'bananas', 'oranges', 'lemons', 'limes', 'strawberries', 'blueberries',
  'spinach', 'lettuce', 'broccoli', 'cauliflower', 'bell peppers', 'mushrooms',
  'avocado', 'cucumber', 'celery', 'ginger', 'herbs', 'basil', 'parsley',
  
  // Pantry staples
  'canned tomatoes', 'coconut oil', 'honey', 'maple syrup', 'vanilla extract',
  'baking powder', 'baking soda', 'vinegar', 'soy sauce', 'stock', 'broth',
  
  // Proteins
  'chicken breast', 'chicken thighs', 'ground beef', 'pork chops', 'bacon',
  'tofu', 'tempeh', 'nuts', 'almonds', 'walnuts', 'cashews', 'seeds',
  
  // Grains & carbs
  'quinoa', 'brown rice', 'white rice', 'oats', 'barley', 'couscous',
  'whole wheat bread', 'sourdough', 'bagels', 'tortillas', 'noodles'
];

export const categoryMappings: Record<string, string> = {
  'dairy-eggs-chilled': 'Dairy & Eggs',
  'meat-fish': 'Meat & Fish',
  'fruit-vegetables': 'Fresh Produce',
  'bakery': 'Bakery',
  'frozen': 'Frozen',
  'grocery': 'Pantry & Canned',
  'drinks': 'Beverages',
  'health-beauty': 'Health & Beauty',
  'household': 'Household',
  'baby': 'Baby',
  'pets': 'Pet Care'
}; 