// ── Energy balance calculation ─────────────────────────────────────────────
// All coefficients are in one place for easy calibration.

export const ENERGY_CONFIG = {
  // kcal burned per kg of lifted tonnage (mechanical work + metabolic overhead)
  TONNAGE_COEFF: 0.045,
  // Clamp floor: minimum workout kcal for any session with tonnage > 0
  WORKOUT_KCAL_MIN: 200,
  // Clamp ceiling: prevents overestimation on very high-volume days
  WORKOUT_KCAL_MAX: 600,
  // Fallback TDEE used when user has not configured their own
  DEFAULT_BASE_TDEE: 2400,
} as const;

/** Estimate kcal burned in a strength session from total tonnage (kg). Returns 0 if no session. */
export function calcWorkoutKcal(tonnageKg: number): number {
  if (tonnageKg <= 0) return 0;
  return Math.round(
    Math.min(
      Math.max(tonnageKg * ENERGY_CONFIG.TONNAGE_COEFF, ENERGY_CONFIG.WORKOUT_KCAL_MIN),
      ENERGY_CONFIG.WORKOUT_KCAL_MAX,
    ),
  );
}

/** Total daily expenditure = base TDEE + workout addon. */
export function calcExpenditure(baseTdee: number, workoutKcal: number): number {
  return baseTdee + workoutKcal;
}

/** Deficit > 0 = caloric deficit (losing), < 0 = surplus (gaining). */
export function calcDeficit(expenditure: number, eatenKcal: number): number {
  return Math.round(expenditure - eatenKcal);
}
