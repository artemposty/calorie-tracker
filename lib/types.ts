export interface FoodEntry {
  id: string;
  name: string;
  grams: number;
  kcal: number;
  p: number;
  f: number;
  c: number;
  time: string;
}

export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number;
}

export interface Goals {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface FoodItem {
  name: string;
  kcal: number; // per 100g
  p: number;
  f: number;
  c: number;
  category: string;
}

export interface DayTotals {
  kcal: number;
  p: number;
  f: number;
  c: number;
}

export interface UserFoodItem {
  id: string;
  name: string;
  kcal: number;
  p: number;
  f: number;
  c: number;
}

export interface AppExport {
  version: number;
  exportDate: string;
  nutrition: Record<string, FoodEntry[]>;
  weight: WeightEntry[];
  goals: Goals;
}
