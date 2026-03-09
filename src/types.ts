export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Brunch';

export type HouseholdType = 'Single' | 'Family' | 'Child' | 'Elderly';

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  youtubeUrl?: string;
  shoppingList?: string[];
  advancePrep?: string;
  estimatedCost?: number;
}

export interface MealPlan {
  day: string;
  meals: {
    [key in MealType]: Recipe[];
  };
}
