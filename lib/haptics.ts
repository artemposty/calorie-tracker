// Haptic feedback that actually works on iOS.
//
// navigator.vibrate exists only on Android Chrome — iOS Safari (including
// standalone PWAs) has no Vibration API at all, which is why haptics never
// fired in this app. Since iOS 17.4, however, toggling a native
// <input type="checkbox" switch> produces a real haptic tick. We keep one
// hidden switch element and click it programmatically — this must happen
// inside a user-gesture call stack, which all our haptic() calls are.

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error';

const VIBRATE: Record<HapticType, number | number[]> = {
  light:   10,
  medium:  20,
  heavy:   35,
  success: [10, 50, 10],
  error:   [30, 40, 30],
};

// iOS switch ticks are a fixed strength — express patterns as tick counts.
const IOS_TICKS: Record<HapticType, number> = {
  light: 1, medium: 1, heavy: 1, success: 2, error: 3,
};

let switchEl: HTMLInputElement | null = null;

function getSwitchEl(): HTMLInputElement | null {
  if (typeof document === 'undefined') return null;
  if (switchEl && document.body.contains(switchEl)) return switchEl;
  const el = document.createElement('input');
  el.type = 'checkbox';
  el.setAttribute('switch', '');
  el.tabIndex = -1;
  el.setAttribute('aria-hidden', 'true');
  // Must NOT be display:none — iOS skips the haptic for fully hidden elements.
  el.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;';
  document.body.appendChild(el);
  switchEl = el;
  return el;
}

export function haptic(type: HapticType = 'light') {
  if (typeof navigator === 'undefined') return;

  if ('vibrate' in navigator) {
    try { navigator.vibrate(VIBRATE[type]); } catch { /* noop */ }
    return;
  }

  // iOS 17.4+ fallback
  const el = getSwitchEl();
  if (!el) return;
  try {
    el.click();
    for (let i = 1; i < IOS_TICKS[type]; i++) {
      setTimeout(() => el.click(), i * 90);
    }
  } catch { /* noop */ }
}
