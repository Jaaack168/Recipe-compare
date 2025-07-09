import React, { useEffect, useState, useRef } from 'react';
import { Search, Clock, X, Loader2, AlertCircle } from 'lucide-react';
import { searchRecipes } from '../utils/staticApi';

interface RecipeSearchProps {
  onSearch: (query: string) => void;
  onRecipesFound?: (recipes: any[], isLoading: boolean, error: string | null, query: string) => void;
}
export function RecipeSearch({
  onSearch,
  onRecipesFound
}: RecipeSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);
  // Handle clicks outside the search component to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  // Handle search submission
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      setIsLoading(true);
      setError(null);
      
      try {
        // Add to recent searches if not already present
        if (!recentSearches.includes(searchQuery)) {
          const updatedSearches = [searchQuery, ...recentSearches.slice(0, 4)];
          setRecentSearches(updatedSearches);
          localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
        }
        
        // Call the legacy search handler for compatibility
        onSearch(searchQuery);
        
        // Also call the new API search if callback provided
        if (onRecipesFound) {
          onRecipesFound([], true, null, searchQuery);
          
          const result = await searchRecipes(searchQuery);
          onRecipesFound(result.recipes, false, null, searchQuery);
          
          if (result.isFallback) {
            setError('Using offline recipes - API temporarily unavailable');
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to search recipes';
        setError(errorMessage);
        
        if (onRecipesFound) {
          onRecipesFound([], false, errorMessage, searchQuery);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };
  // Handle selecting a recent search
  const handleSelectRecentSearch = async (query: string) => {
    setSearchQuery(query);
    setIsFocused(false);
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the legacy search handler for compatibility
      onSearch(query);
      
      // Also call the new API search if callback provided
      if (onRecipesFound) {
        onRecipesFound([], true, null, query);
        
        const result = await searchRecipes(query);
        onRecipesFound(result.recipes, false, null, query);
        
        if (result.isFallback) {
          setError('Using offline recipes - API temporarily unavailable');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search recipes';
      setError(errorMessage);
      
      if (onRecipesFound) {
        onRecipesFound([], false, errorMessage, query);
      }
    } finally {
      setIsLoading(false);
    }
  };
  // Clear all recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };
  return <div className="w-full relative" ref={searchRef}>
      <div className="relative flex items-center">
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onFocus={() => setIsFocused(true)} onKeyDown={e => {
        if (e.key === 'Enter') {
          handleSearch();
        }
      }} placeholder="Search for a recipe..." className="w-full pl-4 pr-14 py-3 rounded-lg border border-gray-200 dark:border-dark-soft-input-border bg-white dark:bg-dark-soft-input text-gray-900 dark:text-dark-soft-input-text placeholder:text-gray-400 dark:placeholder:text-dark-soft-text-muted focus:ring-2 focus:ring-[#6DBE45] focus:border-transparent outline-none text-sm" />
        <button 
          className="absolute right-1 bg-[#6DBE45] text-white p-2 rounded-lg text-sm font-medium hover:bg-[#5ca93a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
          onClick={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-lg flex items-start">
          <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-yellow-800 dark:text-yellow-200">{error}</span>
        </div>
      )}

      {/* Recent Searches Dropdown */}
      {isFocused && recentSearches.length > 0 && <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-dark-soft-light rounded-lg shadow-md border border-gray-100 dark:border-dark-soft-border overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-dark-soft-border flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500 dark:text-dark-soft-text-muted">
              Recent Searches
            </span>
            <button onClick={clearRecentSearches} className="text-xs text-[#6DBE45] hover:text-[#5ca93a] font-medium">
              Clear All
            </button>
          </div>
          <ul>
            {recentSearches.map((query, index) => <li key={index}>
                <button onClick={() => handleSelectRecentSearch(query)} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-dark-soft-hover flex items-center text-sm text-gray-700 dark:text-dark-soft-text">
                  <Clock size={14} className="mr-2 text-gray-400 dark:text-dark-soft-text-muted" />
                  {query}
                </button>
              </li>)}
          </ul>
        </div>}
    </div>;
}