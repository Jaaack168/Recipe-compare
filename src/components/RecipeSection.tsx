import React from 'react';
import { Link } from 'react-router-dom';
import { RecipeCard } from './RecipeCard';
import { ChevronRight } from 'lucide-react';

interface RecipeSectionProps {
  title: string;
  recipes: Array<{
    id: number;
    title: string;
    image: string;
    time: string;
    price: string;
    available?: boolean;
  }>;
  viewAllLink?: string;
}

export function RecipeSection({
  title,
  recipes,
  viewAllLink = '/recipes'
}: RecipeSectionProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-dark-soft-text">{title}</h2>
        <Link 
          to={viewAllLink} 
          className="flex items-center text-[#6DBE45] text-sm font-medium hover:text-[#5ca93a] transition-colors"
        >
          View all <ChevronRight size={16} />
        </Link>
      </div>
      <div className="flex overflow-x-auto pb-4 -mx-4 px-4 space-x-4 scrollbar-hide">
        {recipes.map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}