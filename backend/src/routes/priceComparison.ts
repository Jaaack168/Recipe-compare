import { Router, Request, Response } from 'express';
import { PriceComparisonService } from '../services/PriceComparisonService.js';
import { PriceComparisonRequest, Supermarket } from '../types/index.js';

const router = Router();
const priceComparisonService = new PriceComparisonService();

// Main price comparison endpoint
router.post('/compare-prices', async (req: Request, res: Response) => {
  try {
    const { ingredients, postcode, radius_miles }: PriceComparisonRequest = req.body;

    // Validate request
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        error: 'Invalid ingredients. Must be a non-empty array of strings.'
      });
    }

    if (!postcode || typeof postcode !== 'string') {
      return res.status(400).json({
        error: 'Invalid postcode. Must be a valid UK postcode string.'
      });
    }

    const result = await priceComparisonService.compareIngredientPrices({
      ingredients,
      postcode,
      radius_miles: radius_miles || 10
    });

    res.json(result);
  } catch (error) {
    console.error('Price comparison error:', error);
    res.status(500).json({
      error: 'Failed to compare prices',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get products by category
router.get('/products/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const { supermarket } = req.query;

    const products = await priceComparisonService.getProductsByCategory(
      category,
      supermarket as Supermarket | undefined
    );

    res.json({
      category,
      supermarket: supermarket || 'all',
      products,
      total: products.length
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      error: 'Failed to get products by category',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Search products
router.get('/products/search', async (req: Request, res: Response) => {
  try {
    const { q: query, supermarket } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Invalid query parameter. Must be a non-empty string.'
      });
    }

    const products = await priceComparisonService.searchProducts(
      query,
      supermarket as any
    );

    res.json({
      query,
      supermarket: supermarket || 'all',
      products,
      total: products.length
    });
  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).json({
      error: 'Failed to search products',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get recent price changes
router.get('/price-changes', async (req: Request, res: Response) => {
  try {
    const { days } = req.query;
    const daysParam = days ? parseInt(days as string, 10) : 7;

    if (isNaN(daysParam) || daysParam < 1 || daysParam > 30) {
      return res.status(400).json({
        error: 'Invalid days parameter. Must be a number between 1 and 30.'
      });
    }

    const priceChanges = await priceComparisonService.getRecentPriceChanges(daysParam);

    res.json({
      days: daysParam,
      price_changes: priceChanges,
      total: priceChanges.length
    });
  } catch (error) {
    console.error('Get price changes error:', error);
    res.status(500).json({
      error: 'Failed to get price changes',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get store statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await priceComparisonService.getStoreStats();
    res.json(stats);
  } catch (error) {
    console.error('Get store stats error:', error);
    res.status(500).json({
      error: 'Failed to get store statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test ingredient matching (development endpoint)
router.post('/test-match', async (req: Request, res: Response) => {
  try {
    const { ingredient, supermarket } = req.body;

    if (!ingredient || typeof ingredient !== 'string') {
      return res.status(400).json({
        error: 'Invalid ingredient. Must be a non-empty string.'
      });
    }

    const result = await priceComparisonService.testIngredientMatch(
      ingredient,
      supermarket
    );

    res.json({
      ingredient,
      supermarket: supermarket || 'all',
      matches: result
    });
  } catch (error) {
    console.error('Test ingredient match error:', error);
    res.status(500).json({
      error: 'Failed to test ingredient match',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 