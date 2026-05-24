export function haptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  const patterns: Record<typeof type, number | number[]> = {
    light:   10,
    medium:  20,
    heavy:   35,
    success: [10, 50, 10],
    error:   [30, 40, 30],
  };
  try { navigator.vibrate(patterns[type]); } catch {}
}
