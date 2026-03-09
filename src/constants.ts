import { Recipe } from './types';

export const INITIAL_RECIPES: Record<string, Recipe> = {
  'poha': {
    id: 'poha',
    name: 'Indori Poha',
    description: 'Light, fluffy flattened rice seasoned with turmeric, mustard seeds, and topped with crunchy sev.',
    ingredients: ['Flattened rice (Poha)', 'Onions', 'Peanuts', 'Green chilies', 'Turmeric', 'Mustard seeds', 'Curry leaves', 'Lemon', 'Sev'],
    instructions: [
      'Wash poha and drain water completely.',
      'Heat oil, add mustard seeds, peanuts, and curry leaves.',
      'Add onions and chilies, sauté until translucent.',
      'Add turmeric and poha, mix well.',
      'Steam for 2 minutes, garnish with lemon and sev.'
    ],
    prepTime: 10,
    cookTime: 10,
    nutrition: { calories: 250, protein: 5, carbs: 45, fats: 8 }
  },
  'moong-dal-chilla': {
    id: 'moong-dal-chilla',
    name: 'Moong Dal Chilla',
    description: 'High-protein savory pancakes made from yellow moong dal, perfect for a quick breakfast.',
    ingredients: ['Moong dal (soaked)', 'Ginger', 'Green chili', 'Cumin seeds', 'Salt', 'Paneer (optional filling)'],
    instructions: [
      'Grind soaked dal with ginger and chili into a smooth paste.',
      'Add salt and cumin seeds.',
      'Spread on a non-stick pan like a crepe.',
      'Cook until golden brown on both sides.',
      'Serve with green chutney.'
    ],
    prepTime: 15,
    cookTime: 10,
    nutrition: { calories: 180, protein: 12, carbs: 25, fats: 4 }
  },
  'paneer-bhurji': {
    id: 'paneer-bhurji',
    name: 'Quick Paneer Bhurji',
    description: 'Scrambled cottage cheese with vibrant spices and vegetables.',
    ingredients: ['Paneer (crumbled)', 'Onions', 'Tomatoes', 'Capsicum', 'Ginger-garlic paste', 'Turmeric', 'Garam masala'],
    instructions: [
      'Sauté onions and ginger-garlic paste.',
      'Add tomatoes and capsicum, cook until soft.',
      'Add spices and crumbled paneer.',
      'Cook for 3-4 minutes, garnish with coriander.'
    ],
    prepTime: 10,
    cookTime: 10,
    nutrition: { calories: 320, protein: 18, carbs: 10, fats: 24 }
  },
  'oats-upma': {
    id: 'oats-upma',
    name: 'Vegetable Oats Upma',
    description: 'A fiber-rich Indian breakfast made with rolled oats and mixed vegetables.',
    ingredients: ['Rolled oats', 'Carrots', 'Beans', 'Peas', 'Mustard seeds', 'Urad dal', 'Curry leaves'],
    instructions: [
      'Dry roast oats for 2 minutes.',
      'In a pan, temper mustard seeds, urad dal, and curry leaves.',
      'Add vegetables and sauté.',
      'Add water (1.5 cups for 1 cup oats) and salt.',
      'Add oats, cook until water is absorbed.'
    ],
    prepTime: 10,
    cookTime: 15,
    nutrition: { calories: 210, protein: 7, carbs: 35, fats: 6 }
  }
};
