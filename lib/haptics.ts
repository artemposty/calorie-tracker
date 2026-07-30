// Haptic feedback.
//
// Android: navigator.vibrate, works normally.
//
// iOS: Safari has never implemented the Vibration API. The only known way to
// reach the Taptic Engine from the web was a quirk of the native
// <input type="checkbox" switch> control (Safari 17.4+), which emits a haptic
// tick when toggled. WebKit ignores a script-driven click on the input itself,
// so the trick is to click an associated <label> instead.
//
// Apple patched this in iOS 26.5 — on 26.5 and newer there is currently no way
// to trigger haptics from a web page at all. The code below still runs so
// devices on iOS 17.4–26.4 keep their feedback; on newer versions it is simply
// a no-op rather than an error.

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

const SWITCH_ID = 'ct-haptic-switch';

let hapticLabel: HTMLLabelElement | null = null;
let mounted = false;

function mountIosSwitch() {
  if (mounted || typeof document === 'undefined') return;
  mounted = true;

  const build = () => {
    if (hapticLabel || document.getElementById(SWITCH_ID)) return;

    // Parked off-screen rather than hidden: display:none / visibility:hidden /
    // opacity:0 all suppress the haptic, being outside the viewport does not.
    const holder = document.createElement('div');
    holder.setAttribute('aria-hidden', 'true');
    holder.style.cssText = 'position:fixed;left:-9999px;top:0;pointer-events:none;';

    const input = document.createElement('input');
    input.type = 'checkbox';
    // Attribute, not property — this is what makes WebKit render a switch.
    input.setAttribute('switch', '');
    input.id = SWITCH_ID;
    input.tabIndex = -1;

    const label = document.createElement('label');
    label.htmlFor = SWITCH_ID;

    holder.append(input, label);
    document.body.appendChild(holder);
    hapticLabel = label;
  };

  if (document.body) build();
  else document.addEventListener('DOMContentLoaded', build, { once: true });
}

// Mount as soon as this module is first imported on the client, so the element
// already exists by the time a gesture handler calls haptic().
mountIosSwitch();

export function haptic(type: HapticType = 'light') {
  if (typeof navigator === 'undefined') return;

  if (typeof navigator.vibrate === 'function') {
    try { navigator.vibrate(VIBRATE[type]); } catch { /* noop */ }
    return;
  }

  mountIosSwitch();
  const label = hapticLabel;
  if (!label) return;

  try {
    label.click();
    for (let i = 1; i < IOS_TICKS[type]; i++) {
      setTimeout(() => label.click(), i * 90);
    }
  } catch { /* noop */ }
}
