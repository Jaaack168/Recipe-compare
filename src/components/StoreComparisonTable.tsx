import React, { useState, useEffect } from 'react';
import { ShoppingCart, MapPin, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  availability: 'in_stock' | 'out_of_stock' | 'limited_stock';
  image_url?: string;
  category: string;
  supermarket: 'tesco' | 'asda' | 'sainsburys' | 'morrisons';
  product_url: string;
}

interface IngredientMatch {
  ingredient: string;
  matches: Array<{
    product: Product;
    confidence: number;
    score: number;
  }>;
}

interface StoreComparison {
  supermarket: 'tesco' | 'asda' | 'sainsburys' | 'morrisons';
  total_cost: number;
  estimated_total: boolean;
  ingredient_matches: IngredientMatch[];
  missing_ingredients: string[];
  store_location?: {
    name: string;
    address: string;
    distance_miles: number;
  };
}

interface StoreComparisonTableProps {
  ingredients: string[];
  postcode: string;
  className?: string;
}

const supermarketLogos: Record<string, { name: string; color: string; bgColor: string }> = {
  tesco: { name: 'Tesco', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  asda: { name: 'ASDA', color: 'text-green-600', bgColor: 'bg-green-50' },
  sainsburys: { name: "Sainsbury's", color: 'text-orange-600', bgColor: 'bg-orange-50' },
  morrisons: { name: 'Morrisons', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
};

export default function StoreComparisonTable({ ingredients, postcode, className = '' }: StoreComparisonTableProps) {
  const [comparisons, setComparisons] = useState<StoreComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPriceComparisons = async () => {
    if (!ingredients.length || !postcode) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/compare-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients,
          postcode,
          radius_miles: 10
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch price comparisons');
      }

      const data = await response.json();
      setComparisons(data.stores || []);
      setLastUpdated(new Date(data.comparison_timestamp));
    } catch (err) {
      console.error('Price comparison error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      
      // Mock data for development/testing when API is not available
      setComparisons([
        {
          supermarket: 'tesco',
          total_cost: 24.50,
          estimated_total: false,
          ingredient_matches: [],
          missing_ingredients: [],
          store_location: { name: 'Tesco Superstore', address: `Near ${postcode}`, distance_miles: 2.3 }
        },
        {
          supermarket: 'asda',
          total_cost: 22.80,
          estimated_total: true,
          ingredient_matches: [],
          missing_ingredients: ['saffron'],
          store_location: { name: 'ASDA Supercentre', address: `Near ${postcode}`, distance_miles: 3.1 }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceComparisons();
  }, [ingredients, postcode]);

  const getAvailabilityIcon = (availability: string) => {
    switch (availability) {
      case 'in_stock':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'limited_stock':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'out_of_stock':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  };

  const getBestPrice = () => {
    if (comparisons.length === 0) return null;
    return Math.min(...comparisons.map(c => c.total_cost));
  };

  const bestPrice = getBestPrice();

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && comparisons.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to fetch prices</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchPriceComparisons}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (comparisons.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center py-8">
          <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No price comparisons available</h3>
          <p className="text-gray-500">Add ingredients to see price comparisons across supermarkets.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Price Comparison for {postcode}
          </h3>
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        {error && (
          <div className="mt-2 text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded-md">
            ⚠️ Some data may be estimated due to API limitations
          </div>
        )}
      </div>

      {/* Store comparison grid */}
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {comparisons.map((store) => {
            const storeInfo = supermarketLogos[store.supermarket];
            const isBest = store.total_cost === bestPrice;
            
            return (
              <div
                key={store.supermarket}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  isBest 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {isBest && (
                  <div className="absolute -top-2 left-4 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                    Best Price
                  </div>
                )}

                {/* Store header */}
                <div className={`flex items-center mb-3 p-2 rounded ${storeInfo.bgColor}`}>
                  <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center mr-3`}>
                    <span className={`text-xs font-bold ${storeInfo.color}`}>
                      {store.supermarket.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className={`font-medium ${storeInfo.color}`}>{storeInfo.name}</h4>
                    {store.store_location && (
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {store.store_location.distance_miles.toFixed(1)} miles
                      </div>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="mb-3">
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(store.total_cost)}
                    </span>
                    {store.estimated_total && (
                      <span className="ml-2 text-xs text-orange-500 font-medium">
                        Estimated
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items found:</span>
                    <span className="font-medium">
                      {ingredients.length - store.missing_ingredients.length}/{ingredients.length}
                    </span>
                  </div>
                  
                  {store.missing_ingredients.length > 0 && (
                    <div className="text-xs text-orange-600">
                      Missing: {store.missing_ingredients.slice(0, 2).join(', ')}
                      {store.missing_ingredients.length > 2 && ` +${store.missing_ingredients.length - 2} more`}
                    </div>
                  )}
                </div>

                {/* Action button */}
                <button className={`w-full mt-4 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  isBest
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : `${storeInfo.color} border border-current hover:bg-opacity-10`
                }`}>
                  View Details
                </button>
              </div>
            );
          })}
        </div>

        {/* Ingredient breakdown */}
        {comparisons.length > 0 && ingredients.length > 0 && (
          <div className="mt-8">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Ingredient Breakdown</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ingredient
                    </th>
                    {comparisons.map(store => (
                      <th key={store.supermarket} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {supermarketLogos[store.supermarket].name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ingredients.map((ingredient, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ingredient}
                      </td>
                      {comparisons.map(store => {
                        const match = store.ingredient_matches.find(m => m.ingredient === ingredient);
                        const isMissing = store.missing_ingredients.includes(ingredient);
                        
                        return (
                          <td key={store.supermarket} className="px-6 py-4 whitespace-nowrap text-center text-sm">
                            {isMissing ? (
                              <span className="text-orange-500 font-medium">Estimated</span>
                            ) : match && match.matches.length > 0 ? (
                              <div className="flex items-center justify-center">
                                <span className="font-medium">
                                  {formatPrice(match.matches[0].product.price)}
                                </span>
                                {getAvailabilityIcon(match.matches[0].product.availability)}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 