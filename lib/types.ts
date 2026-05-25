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
  defaultGrams?: number;
}

export interface AppExport {
  version: number;
  exportDate: string;
  nutrition: Record<string, FoodEntry[]>;
  weight: WeightEntry[];
  goals: Goals;
}

export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'legs' | 'glutes' | 'core' | 'calves' | 'forearms' | 'lower_back';

export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'other';

export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  isCustom: boolean;
  isSystem: boolean;
  notes?: string;
  displayOrder: number;
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  exercise?: Exercise;
  date: string; // YYYY-MM-DD
  weight: number;
  reps: number;
  rpe: number;
  notes?: string;
  createdAt: string;
}

export interface WorkoutSetWithExercise extends WorkoutSet {
  exercise: Exercise;
}
