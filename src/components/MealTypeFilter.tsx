import React from 'react';
import { Coffee, Sandwich, UtensilsCrossed, Cake } from 'lucide-react';

interface MealTypeFilterProps {
  selectedMealType: string | null;
  onMealTypeChange: (mealType: string | null) => void;
}

export function MealTypeFilter({
  selectedMealType,
  onMealTypeChange
}: MealTypeFilterProps) {
  const mealTypes = [{
    name: 'Breakfast',
    icon: <Coffee size={16} />
  }, {
    name: 'Lunch',
    icon: <Sandwich size={16} />
  }, {
    name: 'Dinner',
    icon: <UtensilsCrossed size={16} />
  }, {
    name: 'Dessert',
    icon: <Cake size={16} />
  }];

  return (
    <div className="flex justify-center overflow-x-auto py-2 -mx-4 px-4 gap-3 scrollbar-hide">
      {mealTypes.map(mealType => (
        <button
          key={mealType.name}
          onClick={() => onMealTypeChange(selectedMealType === mealType.name ? null : mealType.name)}
          className={`py-1.5 px-4 rounded-full text-sm whitespace-nowrap transition-colors flex items-center border ${
            selectedMealType === mealType.name 
              ? 'bg-[#3CBC8D] text-white font-semibold border-[#3CBC8D]' 
              : 'bg-[#2C2C3A] text-white font-medium border-[#3D3D4D] hover:bg-[#3A3A4D]'
          }`}
        >
          <span className="mr-1.5">{mealType.icon}</span>
          {mealType.name}
        </button>
      ))}
    </div>
  );
}