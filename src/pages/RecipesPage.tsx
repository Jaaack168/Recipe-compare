import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle, Search, Filter, ChevronDown } from 'lucide-react';
import { RecipeSearch } from '../components/RecipeSearch';
import { FilterChips, FilterCategory, FILTER_CATEGORIES } from '../components/FilterChips';
import { BottomNavBar } from '../components/BottomNavBar';
import { HeaderIcons } from '../components/HeaderIcons';
import { PostcodeChecker, usePostcode } from '../components/PostcodeChecker';
import { RecipeCard } from '../components/RecipeCard';
import { MealTypeFilter } from '../components/MealTypeFilter';
import { Recipe, fetchFilteredRecipes, mapFilterToApiParams } from '../utils/staticApi';

// Sort options
type SortOption = 'default' | 'time-asc' | 'time-desc' | 'price-asc';

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'time-asc', label: 'Time (Shortest to Longest)' },
  { value: 'time-desc', label: 'Time (Longest to Shortest)' },
  { value: 'price-asc', label: 'Price (Low to High)' }
] as const;

// Sort By Dropdown Component
function SortByDropdown({ 
  selectedSort, 
  onSortChange 
}: { 
  selectedSort: SortOption; 
  onSortChange: (sort: SortOption) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = SORT_OPTIONS.find(option => option.value === selectedSort);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-dark-soft-light border border-gray-200 dark:border-dark-soft-border rounded-lg text-sm font-medium text-gray-700 dark:text-dark-soft-text hover:bg-gray-50 dark:hover:bg-dark-soft-lighter transition-colors"
      >
        <span>Sort: {selectedOption?.label}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-dark-soft-light border border-gray-200 dark:border-dark-soft-border rounded-lg shadow-lg z-20">
            {SORT_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  onSortChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-dark-soft-lighter transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  selectedSort === option.value 
                    ? 'bg-[#6DBE45]/10 text-[#6DBE45] font-medium' 
                    : 'text-gray-700 dark:text-dark-soft-text'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Shimmer loading component
function RecipeCardSkeleton() {
  return (
    <div className="w-full max-w-[200px] rounded-xl overflow-hidden bg-white dark:bg-dark-soft-light shadow-sm border border-gray-100 dark:border-dark-soft-border animate-pulse">
      <div className="h-[140px] bg-gray-200 dark:bg-dark-soft-lighter"></div>
      <div className="p-3">
        <div className="h-4 bg-gray-200 dark:bg-dark-soft-lighter rounded mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-dark-soft-lighter rounded mb-3 w-3/4"></div>
        <div className="flex gap-2">
          <div className="flex-1 h-8 bg-gray-200 dark:bg-dark-soft-lighter rounded"></div>
          <div className="flex-1 h-8 bg-gray-200 dark:bg-dark-soft-lighter rounded"></div>
        </div>
      </div>
    </div>
  );
}

// Helper function to parse time string and convert to minutes
function parseTimeToMinutes(timeString: string): number {
  const time = timeString.toLowerCase();
  if (time === 'n/a' || !time) return 999; // Put N/A times at the end
  
  const match = time.match(/(\d+)/);
  if (match) {
    return parseInt(match[1]);
  }
  return 999; // Default for unparseable times
}

// Helper function to parse price string and convert to number
function parsePriceToNumber(priceString: string): number {
  const price = priceString.replace(/[£$€,]/g, '');
  const parsed = parseFloat(price);
  return isNaN(parsed) ? 999 : parsed;
}

// Helper function to sort recipes
function sortRecipes(recipes: Recipe[], sortBy: SortOption): Recipe[] {
  if (sortBy === 'default') return recipes;
  
  return [...recipes].sort((a, b) => {
    switch (sortBy) {
      case 'time-asc':
        return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
      case 'time-desc':
        return parseTimeToMinutes(b.time) - parseTimeToMinutes(a.time);
      case 'price-asc':
        return parsePriceToNumber(a.price) - parsePriceToNumber(b.price);
      default:
        return 0;
    }
  });
}

// Helper function to validate filter parameter
function isValidFilterCategory(filter: string): filter is FilterCategory {
  return FILTER_CATEGORIES.includes(filter as FilterCategory);
}

export function RecipesPage() {
  const { postcode, postcodeInfo, nearbyStores } = usePostcode();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Core state
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState<SortOption>('default');

  // Recipe data state
  const [currentRecipes, setCurrentRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('');
  const [totalResults, setTotalResults] = useState(0);

  // Handle URL query parameters on page load
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    const mealTypeParam = searchParams.get('mealType');
    const sortParam = searchParams.get('sort');
    
    // Apply filter from URL
    if (filterParam && isValidFilterCategory(filterParam)) {
      setActiveFilter(filterParam);
    }
    
    // Apply meal type from URL
    if (mealTypeParam) {
      setSelectedMealType(mealTypeParam);
    }
    
    // Apply sort from URL
    if (sortParam && SORT_OPTIONS.find(opt => opt.value === sortParam)) {
      setSelectedSort(sortParam as SortOption);
    }
    
    // Keep URL parameters for better user experience (don't clear immediately)
    // This allows users to bookmark filtered views
  }, [searchParams, setSearchParams]);

  // Helper function to filter out invalid or unavailable recipes
  const filterValidRecipes = (recipes: Recipe[]): Recipe[] => {
    return recipes.filter(recipe => {
      // Basic validation - must have title and image
      const hasValidTitle = recipe.title && recipe.title.trim() !== '';
      const hasValidImage = recipe.image && recipe.image !== null && recipe.image.trim() !== '';
      
      // Availability check - hide recipes marked as unavailable
      const isAvailable = recipe.available !== false; // Allow undefined (treat as available) but not false
      
      // Additional quality checks
      const hasReasonableTitle = hasValidTitle && recipe.title.length > 2; // Not just 1-2 characters
      const isNotPlaceholder = !recipe.image?.includes('placeholder') && 
                              !recipe.image?.includes('default') &&
                              !recipe.title?.toLowerCase().includes('test');
      
      return hasValidTitle && 
             hasValidImage && 
             isAvailable && 
             hasReasonableTitle && 
             isNotPlaceholder;
    });
  };

  // Load initial recipes when component mounts
  useEffect(() => {
    const loadInitialRecipes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Load 50 varied recipes by default
        const result = await fetchFilteredRecipes({ number: 50 });
        
        // All recipes are considered available by default
        const recipesWithAvailability = result.recipes.map(recipe => ({
          ...recipe,
          available: true // Always set to true, ignoring location-based availability
        }));
        
        // Filter out only structurally invalid recipes
        const validRecipes = filterValidRecipes(recipesWithAvailability);
        setCurrentRecipes(validRecipes);
        setTotalResults(validRecipes.length);
      } catch (err) {
        setError('Failed to load recipes. Please try again.');
        console.error('Error loading initial recipes:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialRecipes();
  }, []); // Only run on mount

  // Load filtered recipes when filters change
  useEffect(() => {
    const loadFilteredRecipes = async () => {
      // Don't reload if we're showing search results
      if (activeSearchQuery) return;
      
      // Don't reload for initial mount (handled above)
      if (isLoading) return;

      setIsFilterLoading(true);
      setError(null);
      
      try {
        let filterOptions = {};
        
        // Apply category filter via API
        if (activeFilter && activeFilter !== 'All') {
          filterOptions = mapFilterToApiParams(activeFilter);
        }
        
        // Apply meal type filter via API type parameter
        if (selectedMealType) {
          const mealTypeMap: { [key: string]: string } = {
            'Breakfast': 'breakfast',
            'Lunch': 'main course',
            'Dinner': 'main course', 
            'Dessert': 'dessert'
          };
          filterOptions = {
            ...filterOptions,
            type: mealTypeMap[selectedMealType] || selectedMealType.toLowerCase()
          };
        }

        // Fetch filtered recipes
        const result = await fetchFilteredRecipes({
          ...filterOptions,
          number: 50 // Always fetch 50 recipes
        });
        
        // All recipes are considered available by default
        const recipesWithAvailability = result.recipes.map(recipe => ({
          ...recipe,
          available: true // Always set to true, ignoring location-based availability
        }));
        
        // Filter out only structurally invalid recipes
        const validRecipes = filterValidRecipes(recipesWithAvailability);
        setCurrentRecipes(validRecipes);
        setTotalResults(validRecipes.length);
        
      } catch (err) {
        setError('Failed to load filtered recipes. Please try again.');
        console.error('Error loading filtered recipes:', err);
      } finally {
        setIsFilterLoading(false);
      }
    };

    loadFilteredRecipes();
  }, [activeFilter, selectedMealType]); // Removed nearbyStores.length dependency

  // Apply frontend filters and sorting
  useEffect(() => {
    let result = [...currentRecipes];

    // Apply search query filter (frontend only)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(recipe => 
        recipe.title.toLowerCase().includes(query) || 
        (recipe.mealType && recipe.mealType.toLowerCase().includes(query)) ||
        (recipe.summary && recipe.summary.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    result = sortRecipes(result, selectedSort);

    setFilteredRecipes(result);
  }, [currentRecipes, searchQuery, selectedSort]);

  // Handle search input
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveSearchQuery('');
  };

  // Handle API search results from RecipeSearch component
  const handleApiSearch = (recipes: Recipe[], isLoading: boolean, error: string | null, query: string) => {
    if (!isLoading && recipes.length > 0) {
      // All recipes are considered available by default
      const recipesWithAvailability = recipes.map(recipe => ({
        ...recipe,
        available: true // Always set to true, ignoring location-based availability
      }));
      
      // Filter out only structurally invalid recipes
      const validRecipes = filterValidRecipes(recipesWithAvailability);
      setCurrentRecipes(validRecipes);
      setActiveSearchQuery(query);
      setSearchQuery(''); // Clear local search when API search is active
      setTotalResults(validRecipes.length);
    }
    
    if (error) {
      setError(error);
    }
  };

  // Handle filter changes with URL updates
  const handleFilterChange = (filter: FilterCategory | null) => {
    setActiveFilter(filter);
    setActiveSearchQuery(''); // Clear API search when using filters
    
    // Update URL parameters for better UX and bookmarking
    const newParams = new URLSearchParams(searchParams);
    if (filter && filter !== 'All') {
      newParams.set('filter', filter);
    } else {
      newParams.delete('filter');
    }
    setSearchParams(newParams);
  };

  // Handle meal type changes with URL updates
  const handleMealTypeChange = (mealType: string | null) => {
    setSelectedMealType(mealType);
    setActiveSearchQuery(''); // Clear API search when using filters
    
    // Update URL parameters for better UX and bookmarking
    const newParams = new URLSearchParams(searchParams);
    if (mealType) {
      newParams.set('mealType', mealType);
    } else {
      newParams.delete('mealType');
    }
    setSearchParams(newParams);
  };

  // Handle sort changes with URL updates
  const handleSortChange = (sort: SortOption) => {
    setSelectedSort(sort);
    
    // Update URL parameters for better UX and bookmarking
    const newParams = new URLSearchParams(searchParams);
    if (sort !== 'default') {
      newParams.set('sort', sort);
    } else {
      newParams.delete('sort');
    }
    setSearchParams(newParams);
  };

  // Clear all filters and URL parameters
  const clearAllFilters = () => {
    setSelectedMealType(null);
    setActiveFilter(null);
    setSearchQuery('');
    setActiveSearchQuery('');
    setSelectedSort('default');
    
    // Clear all URL parameters for clean state
    setSearchParams({});
  };

  // Determine what to display
  const displayRecipes = activeSearchQuery ? sortRecipes(currentRecipes, selectedSort) : filteredRecipes;
  const isShowingSearchResults = activeSearchQuery.length > 0;
  const isAnyLoading = isLoading || isFilterLoading;

  return (
    <div className="flex flex-col min-h-screen bg-[#f9f7f2] dark:bg-dark-soft w-full">
      <header className="w-full bg-[#f9f7f2] dark:bg-dark-soft border-b border-gray-200/30 dark:border-dark-soft-border/30 py-4 sticky top-0 z-20 shadow-sm">
        <div className="px-4 max-w-screen-xl mx-auto w-full flex justify-between items-center">
          <PostcodeChecker />
          <HeaderIcons />
        </div>
      </header>

      <main className="flex-1 px-4 pt-6 pb-20 max-w-screen-xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-dark-soft-text mb-4">
            All Recipes
          </h1>
          
          {/* Search */}
          <RecipeSearch onSearch={handleSearch} onRecipesFound={handleApiSearch} />
          
          {/* Filters */}
          <div className="mt-6 mb-3">
            <div className="flex items-center justify-between gap-4 mb-4">
              <MealTypeFilter 
                selectedMealType={selectedMealType} 
                onMealTypeChange={handleMealTypeChange} 
              />
              <SortByDropdown 
                selectedSort={selectedSort}
                onSortChange={handleSortChange}
              />
            </div>
          </div>
          
          <FilterChips 
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Search Results Header */}
        {isShowingSearchResults && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-dark-soft-text">
              <Search size={20} className="inline mr-2" />
              Search results for "{activeSearchQuery}"
              {displayRecipes.length > 0 && (
                <span className="text-sm font-normal text-gray-500 dark:text-dark-soft-text-muted ml-2">
                  ({displayRecipes.length} recipes found)
                </span>
              )}
            </h2>
            <button 
              onClick={() => setActiveSearchQuery('')}
              className="text-[#6DBE45] font-medium hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Enhanced Active Filters Display */}
        {(selectedMealType || activeFilter || selectedSort !== 'default') && !isShowingSearchResults && (
          <div className="mb-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-sm">
                <Filter size={16} className="text-gray-500 dark:text-dark-soft-text-muted" />
                <span className="text-gray-600 dark:text-dark-soft-text-muted font-medium">Active filters:</span>
              </div>
              <button
                onClick={clearAllFilters}
                className="text-[#6DBE45] hover:text-[#5ca93a] text-sm font-medium transition-colors hover:underline"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedMealType && (
                <button
                  onClick={() => handleMealTypeChange(null)}
                  className="group inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <span>Meal: {selectedMealType}</span>
                  <span className="text-blue-600 dark:text-blue-300 group-hover:text-blue-800 dark:group-hover:text-blue-100">×</span>
                </button>
              )}
              {activeFilter && activeFilter !== 'All' && (
                <button
                  onClick={() => handleFilterChange(null)}
                  className="group inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                >
                  <span>Diet: {activeFilter}</span>
                  <span className="text-green-600 dark:text-green-300 group-hover:text-green-800 dark:group-hover:text-green-100">×</span>
                </button>
              )}
              {selectedSort !== 'default' && (
                <button
                  onClick={() => handleSortChange('default')}
                  className="group inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                >
                  <span>Sort: {SORT_OPTIONS.find(opt => opt.value === selectedSort)?.label}</span>
                  <span className="text-purple-600 dark:text-purple-300 group-hover:text-purple-800 dark:group-hover:text-purple-100">×</span>
                </button>
              )}
              {isFilterLoading && (
                <span className="flex items-center text-gray-500 dark:text-dark-soft-text-muted text-sm">
                  <Loader2 size={14} className="animate-spin mr-1" />
                  Applying filters...
                </span>
              )}
            </div>
          </div>
        )}

        {/* Results count when not searching */}
        {!isShowingSearchResults && !isAnyLoading && displayRecipes.length > 0 && (
          <div className="mb-4 text-sm text-gray-600 dark:text-dark-soft-text-muted">
            Showing {displayRecipes.length} valid recipes
            {totalResults > displayRecipes.length && (
              <span> • {totalResults} total results available</span>
            )}
          </div>
        )}

        {/* Loading State */}
        {isAnyLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 justify-items-center">
            {Array.from({ length: 12 }).map((_, index) => (
              <RecipeCardSkeleton key={index} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isAnyLoading && (
          <div className="text-center py-12">
            <div className="flex items-center justify-center mb-3">
              <AlertCircle size={48} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-soft-text mb-2">
              Recipe Service Unavailable
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
            <p className="text-gray-500 dark:text-dark-soft-text-muted mb-4 text-sm">
              The recipe API has reached its daily limit. Please check back tomorrow for fresh recipes, or browse our curated collection on the home page.
            </p>
            <div className="space-x-3">
              <button 
                onClick={() => window.location.reload()}
                className="bg-[#6DBE45] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#5ca93a] transition-colors"
              >
                Try again
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Go to Home
              </button>
            </div>
          </div>
        )}

        {/* Recipe Grid */}
        {!isAnyLoading && !error && displayRecipes.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 justify-items-center">
            {displayRecipes.map(recipe => (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                variant="grid"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isAnyLoading && !error && displayRecipes.length === 0 && (
          <div className="text-center py-12">
            <div className="flex items-center justify-center mb-4">
              <Search size={48} className="text-gray-400 dark:text-dark-soft-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-soft-text mb-2">
              No recipes found
            </h3>
            <p className="text-gray-500 dark:text-dark-soft-text-muted mb-4 max-w-md mx-auto">
              {isShowingSearchResults 
                ? `We couldn't find any valid recipes matching "${activeSearchQuery}". Try different search terms or browse our categories.`
                : activeFilter || selectedMealType
                ? "No valid recipes match your current filters. Try adjusting your criteria or browse all recipes."
                : "No valid recipes found. This might be a temporary issue with our recipe service."
              }
            </p>
            <button 
              onClick={clearAllFilters}
              className="bg-[#6DBE45] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#5ca93a] transition-colors"
            >
              {activeFilter || selectedMealType ? 'Clear all filters' : 'Refresh recipes'}
            </button>
          </div>
        )}

        {/* Delivery location info */}
        {postcodeInfo && nearbyStores.length === 0 && (
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              <AlertCircle size={16} className="inline mr-2" />
              No stores found near {postcodeInfo.area}. All recipes are displayed regardless of delivery location. 
              Actual ingredient availability may vary based on store stock when ordering.
            </p>
          </div>
        )}
      </main>

      <BottomNavBar />
    </div>
  );
}