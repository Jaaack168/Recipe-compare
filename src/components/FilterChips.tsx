import React from 'react';
import { Check } from 'lucide-react';

// Define filter categories with proper typing
export const FILTER_CATEGORIES = [
  'All',
  'Quick Meals', 
  'Vegan', 
  'Vegetarian', 
  'High Protein', 
  'Low Carb', 
  'Budget Friendly', 
  'Gluten Free', 
  'Dairy Free'
] as const;

export type FilterCategory = typeof FILTER_CATEGORIES[number];

interface FilterChipProps {
  label: FilterCategory;
  isActive: boolean;
  onClick: () => void;
}

function FilterChip({ label, isActive, onClick }: FilterChipProps) {
  return (
    <button 
      onClick={onClick}
      className={`
        relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium 
        whitespace-nowrap transition-all duration-200 ease-in-out transform
        focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/50 focus:ring-offset-2
        hover:scale-105 active:scale-95
        ${isActive 
          ? `
            bg-gradient-to-r from-[#6DBE45] to-[#5ca93a] 
            text-white font-bold shadow-lg shadow-[#6DBE45]/25
            ring-2 ring-[#6DBE45]/30 ring-offset-2 ring-offset-white dark:ring-offset-dark-soft
          ` 
          : `
            bg-white dark:bg-dark-soft-light text-gray-700 dark:text-dark-soft-text
            border border-gray-200 dark:border-dark-soft-border
            hover:bg-gray-50 dark:hover:bg-dark-soft-lighter
            hover:border-[#6DBE45]/30 hover:text-[#6DBE45]
            hover:shadow-md
          `
        }
      `}
      aria-pressed={isActive}
      aria-label={`Filter by ${label}${isActive ? ' (currently active)' : ''}`}
    >
      {isActive && (
        <Check 
          size={14} 
          className="text-white animate-in fade-in-0 duration-200"
          aria-hidden="true"
        />
      )}
      <span className={isActive ? 'animate-in slide-in-from-left-1 duration-200' : ''}>
        {label}
      </span>
    </button>
  );
}

interface FilterChipsProps {
  activeFilter: FilterCategory | null;
  onFilterChange: (filter: FilterCategory | null) => void;
  className?: string;
  filters?: readonly FilterCategory[];
}

export function FilterChips({
  activeFilter,
  onFilterChange,
  className = '',
  filters = FILTER_CATEGORIES
}: FilterChipsProps) {
  const handleFilterClick = (filter: FilterCategory) => {
    // Single selection logic: if clicking the same filter, deselect it
    if (activeFilter === filter) {
      onFilterChange(null);
    } else {
      onFilterChange(filter);
    }
  };

  return (
    <div 
      className={`
        flex flex-wrap items-center gap-2 py-3
        ${className}
      `}
      role="group"
      aria-label="Recipe filter options"
    >
      {filters.map((filter) => (
        <FilterChip 
          key={filter}
          label={filter}
          isActive={activeFilter === filter}
          onClick={() => handleFilterClick(filter)}
        />
      ))}
      
      {/* Clear all indicator when a filter is active */}
      {activeFilter && activeFilter !== 'All' && (
        <button
          onClick={() => onFilterChange(null)}
          className="
            ml-2 px-3 py-1.5 text-xs text-gray-500 dark:text-dark-soft-text-muted
            hover:text-[#6DBE45] transition-colors duration-200
            underline underline-offset-2 hover:no-underline
            focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/50 focus:ring-offset-1
          "
          aria-label="Clear all filters"
        >
          Clear filter
        </button>
      )}
    </div>
  );
}