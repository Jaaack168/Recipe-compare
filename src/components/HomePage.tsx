import React, { useState, useEffect } from 'react';
import { PostcodeChecker, usePostcode } from './PostcodeChecker';
import { RecipeSection } from './RecipeSection';
import { BottomNavBar } from './BottomNavBar';
import { HeaderIcons } from './HeaderIcons';
import { ApiStatusBanner } from './ApiStatusBanner';
import { 
  fetchSuggestedRecipes, 
  fetchTrendingRecipes, 
  fetchQuickEasyRecipes, 
  fetchHighProteinRecipes, 
  Recipe,
  getNoRecipesMessage
} from '../utils/staticApi';
import { mockApiServices } from '../services/mockApiServices';
import { FilterCategory } from './FilterChips';

export function HomePage() {
  const { postcode, postcodeInfo, nearbyStores } = usePostcode();
  const [personalizedSuggestions, setPersonalizedSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Static recipe data - loaded directly from JSON
  const [suggestedRecipes, setSuggestedRecipes] = useState<Recipe[]>([]);
  const [trendingRecipes, setTrendingRecipes] = useState<Recipe[]>([]);
  const [quickEasyRecipes, setQuickEasyRecipes] = useState<Recipe[]>([]);
  const [highProteinRecipes, setHighProteinRecipes] = useState<Recipe[]>([]);
  
  // Availability filtering status
  const [filteredMessages, setFilteredMessages] = useState<{[key: string]: string}>({});
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);

  // Load personalized suggestions when postcode changes
  useEffect(() => {
    const loadSuggestions = async () => {
      if (postcode) {
        setIsLoadingSuggestions(true);
        try {
          const suggestions = await mockApiServices.getRecipeSuggestions(postcode);
          setPersonalizedSuggestions(suggestions);
        } catch (error) {
          console.error('Error loading personalized suggestions:', error);
        } finally {
          setIsLoadingSuggestions(false);
        }
      }
    };

    loadSuggestions();
  }, [postcode]);

  // Load all recipes once on component mount and when postcode/stores change
  useEffect(() => {
    const loadAllRecipes = async () => {
      setIsLoadingRecipes(true);
      try {
        // Determine if we should check availability based on postcode/stores
        const checkAvailability = Boolean(postcode && nearbyStores && nearbyStores.length > 0);
        const availabilityOptions = {
          checkAvailability,
          availabilityThreshold: 0.7, // Require 70% of ingredients to be available
        };

        const [suggested, trending, quickEasy, highProtein] = await Promise.all([
          fetchSuggestedRecipes(5, availabilityOptions),
          fetchTrendingRecipes(5, availabilityOptions),
          fetchQuickEasyRecipes(5, availabilityOptions),
          fetchHighProteinRecipes(5, availabilityOptions)
        ]);

        setSuggestedRecipes(suggested.recipes);
        setTrendingRecipes(trending.recipes);
        setQuickEasyRecipes(quickEasy.recipes);
        setHighProteinRecipes(highProtein.recipes);

        // Set filtered messages if recipes were filtered out
        const messages: {[key: string]: string} = {};
        if (checkAvailability) {
          if (suggested.filteredOut && suggested.filteredOut > 0) {
            messages.suggested = getNoRecipesMessage(suggested.filteredOut, 5 + suggested.filteredOut);
          }
          if (trending.filteredOut && trending.filteredOut > 0) {
            messages.trending = getNoRecipesMessage(trending.filteredOut, 5 + trending.filteredOut);
          }
          if (quickEasy.filteredOut && quickEasy.filteredOut > 0) {
            messages.quickEasy = getNoRecipesMessage(quickEasy.filteredOut, 5 + quickEasy.filteredOut);
          }
          if (highProtein.filteredOut && highProtein.filteredOut > 0) {
            messages.highProtein = getNoRecipesMessage(highProtein.filteredOut, 5 + highProtein.filteredOut);
          }
        }
        setFilteredMessages(messages);

      } catch (error) {
        console.error('Error loading recipes:', error);
      } finally {
        setIsLoadingRecipes(false);
      }
    };

    loadAllRecipes();
  }, [postcode, nearbyStores]);

  // Component for rendering sections
  const renderSection = (title: string, recipes: Recipe[], emoji: string, filterTag?: FilterCategory, sectionKey?: string) => {
    // Generate the view all link with filter tag
    const viewAllLink = filterTag ? `/recipes?filter=${encodeURIComponent(filterTag)}` : '/recipes';
    
    // Check if we have a filtered message for this section
    const filteredMessage = sectionKey ? filteredMessages[sectionKey] : undefined;

    return (
      <div className="mb-8">
        <RecipeSection 
          title={`${emoji} ${title}`}
          recipes={recipes}
          viewAllLink={viewAllLink}
        />
        {/* Show filtered message if recipes were filtered out */}
        {filteredMessage && (
          <div className="mt-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 px-3 py-2 rounded-lg">
            ℹ️ {filteredMessage}
          </div>
        )}
        {/* Show fallback message if no recipes available */}
        {!isLoadingRecipes && recipes.length === 0 && (
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/10 px-3 py-2 rounded-lg text-center">
            {postcode ? 
              "No recipes available right now — try adjusting your filters or checking back later." :
              "Enter your postcode to see personalized recipe availability."
            }
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f9f7f2] dark:bg-dark-soft w-full">
      <header className="w-full bg-[#f9f7f2] dark:bg-dark-soft border-b border-gray-200/30 dark:border-dark-soft-border/30 py-4 sticky top-0 z-20 shadow-sm">
        <div className="px-4 max-w-screen-xl mx-auto w-full flex justify-between items-center">
          <PostcodeChecker />
          <HeaderIcons />
        </div>
      </header>
      <main className="flex-1 px-4 pt-6 pb-20 max-w-screen-xl mx-auto w-full">
        {/* API Status Banner */}
        <ApiStatusBanner />
        
        {/* Render recipe sections */}
        <div className="space-y-8">
          {renderSection("Suggested Recipes", suggestedRecipes, "✨", "Vegetarian", "suggested")}
          {renderSection("Trending Recipes", trendingRecipes, "🔥", undefined, "trending")}
          {renderSection("Quick & Easy", quickEasyRecipes, "⏱", "Quick Meals", "quickEasy")}
          {renderSection("High Protein", highProteinRecipes, "💪", "High Protein", "highProtein")}
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}