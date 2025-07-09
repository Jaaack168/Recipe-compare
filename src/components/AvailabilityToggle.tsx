import React from 'react';
import { EyeOff, Eye } from 'lucide-react';

interface AvailabilityToggleProps {
  hideUnavailable: boolean;
  onToggle: (hideUnavailable: boolean) => void;
  className?: string;
}

export function AvailabilityToggle({ hideUnavailable, onToggle, className = '' }: AvailabilityToggleProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <button
        onClick={() => onToggle(!hideUnavailable)}
        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          hideUnavailable
            ? 'bg-[#6DBE45]/10 text-[#6DBE45] hover:bg-[#6DBE45]/20 dark:bg-[#6DBE45]/20 dark:hover:bg-[#6DBE45]/30'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-soft-lighter dark:text-dark-soft-text-muted dark:hover:bg-dark-soft-hover'
        }`}
        aria-label={hideUnavailable ? 'Show unavailable recipes' : 'Hide unavailable recipes'}
      >
        {hideUnavailable ? (
          <EyeOff size={16} className="mr-2" />
        ) : (
          <Eye size={16} className="mr-2" />
        )}
        <span className="whitespace-nowrap">
          {hideUnavailable ? 'Show All' : 'Hide Unavailable'}
        </span>
      </button>
    </div>
  );
} 