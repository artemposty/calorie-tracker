// Haptic feedback that also works on iOS.
//
// navigator.vibrate exists only on Android — iOS Safari (including installed
// PWAs) has no Vibration API at all, which is why haptics never fired here.
// Since iOS 17.4 a native <input type="checkbox" switch> emits a real haptic
// tick when toggled. Requirements learned the hard way:
//   • the element must already be in the DOM before the gesture, not created
//     inside it
//   • it must be genuinely rendered — display:none / visibility:hidden /
//     opacity:0 all suppress the haptic, so we park it off-screen instead
//   • the toggle must happen inside a user-gesture call stack (all haptic()
//     callers are click/touch handlers, so this holds)

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

let iosSwitch: HTMLInputElement | null = null;
let iosReady = false;

function ensureIosSwitch() {
  if (iosReady || typeof document === 'undefined') return;
  iosReady = true;

  const mount = () => {
    if (iosSwitch) return;
    const el = document.createElement('input');
    el.type = 'checkbox';
    // Attribute (not property) — this is what makes iOS render it as a switch.
    el.setAttribute('switch', '');
    el.tabIndex = -1;
    el.setAttribute('aria-hidden', 'true');
    // Off-screen but fully rendered: opacity/visibility/display tricks kill
    // the haptic, moving it out of the viewport does not.
    el.style.cssText =
      'position:fixed;left:-9999px;top:0;width:32px;height:20px;margin:0;pointer-events:none;';
    document.body.appendChild(el);
    iosSwitch = el;
  };

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount, { once: true });
}

// Mount as early as the module is first imported on the client.
ensureIosSwitch();

export function haptic(type: HapticType = 'light') {
  if (typeof navigator === 'undefined') return;

  if (typeof navigator.vibrate === 'function') {
    try { navigator.vibrate(VIBRATE[type]); } catch { /* noop */ }
    return;
  }

  ensureIosSwitch();
  const el = iosSwitch;
  if (!el) return;

  const tick = () => {
    // Flipping the state is what triggers the feedback; either direction works.
    el.checked = !el.checked;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.click();
  };

  try {
    tick();
    for (let i = 1; i < IOS_TICKS[type]; i++) {
      setTimeout(tick, i * 90);
    }
  } catch { /* noop */ }
}
