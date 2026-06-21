import { Goals } from './types';

// Edit this file to change your daily nutrition targets
export const DEFAULT_GOALS: Goals = {
  kcal: 2250,
  protein: 175,
  fat: 65,
  carbs: 235,
  base_tdee: 2400,
};

export const STARTING_WEIGHT = 87; // kg, for chart reference line

export const NUTRITION_STORAGE_KEY = 'ct-nutrition';
export const WEIGHT_STORAGE_KEY = 'ct-weight';
export const GOALS_STORAGE_KEY = 'ct-goals';
