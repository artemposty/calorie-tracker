'use client';

// Stroke-based exercise pictograms. viewBox 0 0 48 48.
// Side-view figures. Head r=3, body lines sw=2, equipment sw=2.5/plates sw=1.5.

const ICONS: Record<string, React.ReactNode> = {

  // ── CHEST ─────────────────────────────────────────────────────────────────

  // Lying flat. Arms straight up. Barbell directly overhead.
  'bench-press': (
    <g strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="27" width="38" height="3" rx="1.5" strokeWidth="1.5"/>
      <circle cx="8" cy="23" r="3"/>
      <line x1="11" y1="23" x2="38" y2="24" strokeWidth="2"/>
      <line x1="38" y1="24" x2="43" y2="27"/>
      <line x1="40" y1="24" x2="45" y2="28"/>
      <line x1="18" y1="22" x2="16" y2="10" strokeWidth="2"/>
      <line x1="25" y1="22" x2="27" y2="10" strokeWidth="2"/>
      <line x1="10" y1="9" x2="33" y2="9" strokeWidth="2.5"/>
      <circle cx="10" cy="9" r="4" strokeWidth="1.5"/>
      <circle cx="33" cy="9" r="4" strokeWidth="1.5"/>
    </g>
  ),

  // Body on ~30° incline. Bar overhead at angle.
  'incline-press': (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* incline bench surface */}
      <line x1="7" y1="38" x2="37" y2="22" strokeWidth="1.5"/>
      <line x1="7" y1="38" x2="7" y2="44" strokeWidth="1.5"/>
      <line x1="37" y1="22" x2="42" y2="28" strokeWidth="1.5"/>
      {/* figure on incline — head top-right, legs bottom-left */}
      <circle cx="32" cy="18" r="3"/>
      <line x1="30" y1="21" x2="14" y2="32" strokeWidth="2"/>
      <line x1="14" y1="32" x2="10" y2="38"/>
      <line x1="15" y1="32" x2="12" y2="38"/>
      {/* arms push UP-RIGHT from chest */}
      <line x1="26" y1="24" x2="32" y2="13" strokeWidth="2"/>
      <line x1="22" y1="26" x2="28" y2="15" strokeWidth="2"/>
      {/* barbell */}
      <line x1="22" y1="11" x2="38" y2="8" strokeWidth="2.5"/>
      <circle cx="22" cy="11" r="3.5" strokeWidth="1.5"/>
      <circle cx="38" cy="8" r="3.5" strokeWidth="1.5"/>
    </g>
  ),

  // Standing. Arms spread wide to sides, cable handles at ends, arcing inward.
  'chest-fly': (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* cable pulleys at top corners */}
      <circle cx="4" cy="8" r="2" strokeWidth="1.5"/>
      <circle cx="44" cy="8" r="2" strokeWidth="1.5"/>
      {/* cables to hands */}
      <line x1="4" y1="8" x2="14" y2="22" strokeWidth="1.5"/>
      <line x1="44" y1="8" x2="34" y2="22" strokeWidth="1.5"/>
      {/* figure standing */}
      <circle cx="24" cy="10" r="3"/>
      <line x1="24" y1="13" x2="24" y2="30" strokeWidth="2"/>
      {/* arms out — hands holding cables */}
      <line x1="24" y1="19" x2="14" y2="22" strokeWidth="2"/>
      <line x1="24" y1="19" x2="34" y2="22" strokeWidth="2"/>
      {/* legs */}
      <line x1="24" y1="30" x2="19" y2="42"/>
      <line x1="24" y1="30" x2="29" y2="42"/>
    </g>
  ),

  // ── BACK ──────────────────────────────────────────────────────────────────

  // Hanging from bar. Arms fully extended above. Body below bar.
  'pullup': (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* overhead bar with supports */}
      <line x1="5" y1="7" x2="43" y2="7" strokeWidth="3"/>
      <line x1="10" y1="5" x2="10" y2="9"/>
      <line x1="38" y1="5" x2="38" y2="9"/>
      {/* arms gripping bar — elbows slightly bent (mid-pull position) */}
      <line x1="17" y1="7" x2="20" y2="16" strokeWidth="2"/>
      <line x1="31" y1="7" x2="28" y2="16" strokeWidth="2"/>
      {/* head between arms, pulled toward bar */}
      <circle cx="24" cy="18" r="3"/>
      {/* torso */}
      <line x1="24" y1="21" x2="24" y2="34" strokeWidth="2"/>
      {/* legs hanging */}
      <line x1="24" y1="34" x2="21" y2="44"/>
      <line x1="24" y1="34" x2="27" y2="44"/>
    </g>
  ),

  // Seated. Cable bar pulled down from overhead to upper chest.
  'lat-pulldown': (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* cable machine top */}
      <line x1="10" y1="4" x2="38" y2="4" strokeWidth="2.5"/>
      <line x1="24" y1="4" x2="24" y2="2"/>
      {/* bar being pulled down */}
      <line x1="12" y1="13" x2="36" y2="13" strokeWidth="2"/>
      <circle cx="12" cy="13" r="2.5" strokeWidth="1.5"/>
      <circle cx="36" cy="13" r="2.5" strokeWidth="1.5"/>
      {/* cables from machine to bar */}
      <line x1="14" y1="4" x2="14" y2="13" strokeWidth="1.5"/>
      <line x1="34" y1="4" x2="34" y2="13" strokeWidth="1.5"/>
      {/* seated figure — arms up gripping bar */}
      <circle cx="24" cy="19" r="3"/>
      <line x1="24" y1="22" x2="24" y2="34" strokeWidth="2"/>
      <line x1="24" y1="25" x2="15" y2="13" strokeWidth="2"/>
      <line x1="24" y1="25" x2="33" y2="13" strokeWidth="2"/>
      {/* thigh restraint + seat */}
      <rect x="16" y="34" width="16" height="3" rx="1.5" strokeWidth="1.5"/>
      <line x1="18" y1="37" x2="16" y2="44"/>
      <line x1="30" y1="37" x2="32" y2="44"/>
    </g>
  ),

  // Seated. Arms pulled horizontally to stomach. Cable from front.
  'cable-row': (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* cable machine — wall left */}
      <rect x="2" y="16" width="4" height="18" rx="1" strokeWidth="1.5"/>
      <circle cx="4" cy="27" r="2" strokeWidth="1.5"/>
      {/* cable horizontal to handle */}
      <line x1="6" y1="27" x2="20" y2="27" strokeWidth="1.5"/>
      <line x1="20" y1="25" x2="20" y2="29" strokeWidth="1.5"/>
      {/* seated figure — elbows pulled back */}
      <circle cx="34" cy="14" r="3"/>
      <line x1="34" y1="17" x2="34" y2="30" strokeWidth="2"/>
      {/* arms reaching forward to cable, elbows bent */}
      <line x1="34" y1="22" x2="20" y2="27" strokeWidth="2"/>
      {/* seat */}
      <rect x="26" y="30" width="14" height="3" rx="1.5" strokeWidth="1.5"/>
      <line x1="26" y1="33" x2="24" y2="43"/>
      <line x1="38" y1="33" x2="40" y2="43"/>
    </g>
  ),

  // Hinging at hips on GHD. Upper body low, legs horizontal.
  'hyperextension': (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* GHD machine frame */}
      <line x1="4" y1="42" x2="44" y2="42" strokeWidth="2"/>
      <line x1="12" y1="32" x2="12" y2="42" strokeWidth="1.5"/>
      <line x1="32" y1="26" x2="32" y2="42" strokeWidth="1.5"/>
      {/* hip pad */}
      <rect x="28" y="24" width="8" height="4" rx="2" strokeWidth="1.5"/>
      {/* ankle pad */}
      <rect x="6" y="20" width="8" height="4" rx="2" strokeWidth="1.5"/>
      {/* legs — horizontal on machine */}
      <line x1="14" y1="22" x2="28" y2="27" strokeWidth="2"/>
      {/* torso angling DOWN (low position) */}
      <line x1="28" y1="27" x2="18" y2="38" strokeWidth="2"/>
      {/* head at bottom */}
      <circle cx="15" cy="40" r="3"/>
      {/* arms crossed at chest */}
      <line x1="18" y1="35" x2="22" y2="31"/>
      <line x1="22" y1="35" x2="18" y2="31"/>
    </g>
  ),

  // ── SHOULDERS ─────────────────────────────────────────────────────────────

  // Standing or seated. Barbell pressed directly overhead, arms fully extended.
  'overhead-press': (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* standing figure */}
      <circle cx="24" cy="12" r="3"/>
      <line x1="24" y1="15" x2="24" y2="32" strokeWidth="2"/>
      {/* arms fully extended overhead */}
      <line x1="24" y1="21" x2="16" y2="7" strokeWidth="2"/>
      <line x1="24" y1="21" x2="32" y2="7" strokeWidth="2"/>
      {/* barbell overhead */}
      <line x1="9" y1="5" x2="39" y2="5" strokeWidth="2.5"/>
      <circle cx="9" cy="5" r="4" strokeWidth="1.5"/>
      <circle cx="39" cy="5" r="4" strokeWidth="1.5"/>
      {/* connect arms to bar */}
      <line x1="16" y1="7" x2="16" y2="5"/>
      <line x1="32" y1="7" x2="32" y2="5"/>
      {/* legs */}
      <line x1="24" y1="32" x2="19" y2="44"/>
      <line x1="24" y1="32" x2="29" y2="44"/>
    </g>
  ),

  // Standing. Arms raised EXACTLY 90° to sides. Dumbbells at ends.
  'lateral-raise': (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* standing figure */}
      <circle cx="24" cy="12" r="3"/>
      <line x1="24" y1="15" x2="24" y2="32" strokeWidth="2"/>
      {/* arms horizontal at shoulder height — T shape */}
      <line x1="24" y1="21" x2="5" y2="21" strokeWidth="2"/>
      <line x1="24" y1="21" x2="43" y2="21" strokeWidth="2"/>
      {/* dumbbells at ends */}
      <rect x="2" y="19" width="5" height="4" rx="1" strokeWidth="1.5"/>
      <rect x="41" y="19" width="5" height="4" rx="1" strokeWidth="1.5"/>
      {/* legs */}
      <line x1="24" y1="32" x2="19" y2="44"/>
      <line x1="24" y1="32" x2="29" y2="44"/>
    </g>
  ),

  // Pulling rope attachment toward FACE. Elbows high and flared outward.
  'face-pull': (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* cable machine left */}
      <rect x="2" y="8" width="4" height="20" rx="1" strokeWidth="1.5"/>
      <circle cx="4" cy="18" r="2" strokeWidth="1.5"/>
      {/* rope splitting to two handles */}
      <line x1="6" y1="18" x2="18" y2="18" strokeWidth="1.5"/>
      <line x1="18" y1="18" x2="22" y2="14"/>
      <line x1="18" y1="18" x2="22" y2="22"/>
      {/* standing figure */}
      <circle cx="34" cy="13" r="3"/>
      <line x1="34" y1="16" x2="34" y2="32" strokeWidth="2"/>
      {/* elbows wide and high — pulling to face */}
      <line x1="34" y1="20" x2="22" y2="14" strokeWidth="2"/>
      <line x1="34" y1="20" x2="22" y2="22" strokeWidth="2"/>
      {/* high elbow visible */}
      <line x1="22" y1="14" x2="14" y2="10" strokeWidth="1.5"/>
      <line x1="22" y1="22" x2="14" y2="22" strokeWidth="1.5"/>
      {/* legs */}
      <line x1="34" y1="32" x2="29" y2="44"/>
      <line x1="34" y1="32" x2="39" y2="44"/>
    </g>
  ),

  // Standing. Shoulders HUNCHED UP toward ears. Dumbbells at sides.
  'shrugs': (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* figure — shoulders pulled high */}
      <circle cx="24" cy="10" r="3"/>
      {/* elevated trapezius shoulders — wide high shrug */}
      <path d="M14 18 Q14 13 24 12 Q34 13 34 18" strokeWidth="2"/>
      <line x1="24" y1="13" x2="24" y2="30" strokeWidth="2"/>
      {/* arms straight down holding dumbbells */}
      <line x1="14" y1="18" x2="12" y2="32" strokeWidth="2"/>
      <line x1="34" y1="18" x2="36" y2="32" strokeWidth="2"/>
      {/* dumbbells */}
      <rect x="8" y="30" width="7" height="3" rx="1" strokeWidth="1.5"/>
      <rect x="33" y="30" width="7" height="3" rx="1" strokeWidth="1.5"/>
      {/* legs */}
      <line x1="24" y1="30" x2="19" y2="42"/>
      <line x1="24" y1="30" x2="29" y2="42"/>
    </g>
  ),

  // ── BICEPS ────────────────────────────────────────────────────────────────

  // Standing. Arms bent ~100°. Barbell curled to upper chest.
  'curl': (
    <g strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="10" r="3"/>
      <line x1="24" y1="13" x2="24" y2="32" strokeWidth="2"/>
      <line x1="24" y1="32" x2="19" y2="44"/>
      <line x1="24" y1="32" x2="29" y2="44"/>
      {/* upper arms hanging at sides */}
      <line x1="24" y1="19" x2="14" y2="26" strokeWidth="2"/>
      <line x1="24" y1="19" x2="34" y2="26" strokeWidth="2"/>
      {/* forearms bent UP — classic curl position */}
      <line x1="14" y1="26" x2="16" y2="36" strokeWidth="2"/>
      <line x1="34" y1="26" x2="32" y2="36" strokeWidth="2"/>
      {/* barbell connecting the two forearms */}
      <line x1="14" y1="36" x2="34" y2="36" strokeWidth="2.5"/>
      <circle cx="14" cy="36" r="3.5" strokeWidth="1.5"/>
      <circle cx="34" cy="36" r="3.5" strokeWidth="1.5"/>
    </g>
  ),

  // Same stance as curl but VERTICAL dumbbell held (neutral grip = hammer).
  'hammer-curl': (
    <g strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="10" r="3"/>
      <line x1="24" y1="13" x2="24" y2="32" strokeWidth="2"/>
      <line x1="24" y1="32" x2="19" y2="44"/>
      <line x1="24" y1="32" x2="29" y2="44"/>
      {/* one arm only for clarity — right arm shown */}
      <line x1="24" y1="19" x2="34" y2="25" strokeWidth="2"/>
      <line x1="34" y1="25" x2="33" y2="36" strokeWidth="2"/>
      {/* VERTICAL dumbbell (neutral grip) */}
      <line x1="33" y1="32" x2="33" y2="42" strokeWidth="2.5"/>
      <rect x="30" y="30" width="6" height="3" rx="1" strokeWidth="1.5"/>
      <rect x="30" y="40" width="6" height="3" rx="1" strokeWidth="1.5"/>
      {/* left arm at side for reference */}
      <line x1="24" y1="19" x2="14" y2="25" strokeWidth="2"/>
      <line x1="14" y1="25" x2="14" y2="35" strokeWidth="2"/>
      <rect x="11" y="33" width="6" height="3" rx="1" strokeWidth="1.5"/>
      <rect x="11" y="38" width="6" height="3" rx="1" strokeWidth="1.5"/>
    </g>
  ),

  // Arm resting at angle on preacher pad. Elbow fixed. Bar curled up.
  'scott-curl': (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* preacher bench pad — slanted surface */}
      <path d="M8 42 L22 22 L32 22 L32 42" strokeWidth="1.5"/>
      <line x1="6" y1="42" x2="34" y2="42" strokeWidth="1.5"/>
      {/* figure seated right of bench */}
      <circle cx="40" cy="14" r="3"/>
      <line x1="40" y1="17" x2="40" y2="30" strokeWidth="2"/>
      <line x1="40" y1="30" x2="36" y2="42"/>
      <line x1="40" y1="30" x2="44" y2="42"/>
      {/* arm resting on pad, elbow on pad surface, forearm curled UP */}
      <line x1="40" y1="21" x2="28" y2="26" strokeWidth="2"/>
      <line x1="28" y1="26" x2="22" y2="18" strokeWidth="2"/>
      {/* bar at top of curl */}
      <line x1="16" y1="16" x2="28" y2="16" strokeWidth="2.5"/>
      <circle cx="16" cy="16" r="3" strokeWidth="1.5"/>
      <circle cx="28" cy="16" r="3" strokeWidth="1.5"/>
    </g>
  ),

  // ── TRICEPS ───────────────────────────────────────────────────────────────

  // Body between parallel bars. Arms supporting weight. Elbows bent.
  'dips': (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* parallel bars */}
      <line x1="7" y1="22" x2="7" y2="40" strokeWidth="1.5"/>
      <line x1="41" y1="22" x2="41" y2="40" strokeWidth="1.5"/>
      <line x1="4" y1="22" x2="44" y2="22" strokeWidth="2.5"/>
      {/* base supports */}
      <line x1="7" y1="40" x2="4" y2="45"/>
      <line x1="7" y1="40" x2="10" y2="45"/>
      <line x1="41" y1="40" x2="38" y2="45"/>
      <line x1="41" y1="40" x2="44" y2="45"/>
      {/* figure dipping between bars */}
      <circle cx="24" cy="13" r="3"/>
      <line x1="24" y1="16" x2="24" y2="30" strokeWidth="2"/>
      {/* arms on bars — elbows bent ~90° */}
      <line x1="24" y1="21" x2="7" y2="22" strokeWidth="2"/>
      <line x1="24" y1="21" x2="41" y2="22" strokeWidth="2"/>
      {/* legs hanging or slightly bent */}
      <line x1="24" y1="30" x2="21" y2="40"/>
      <line x1="21" y1="40" x2="21" y2="46"/>
      <line x1="24" y1="30" x2="27" y2="40"/>
      <line x1="27" y1="40" x2="27" y2="46"/>
    </g>
  ),

  // Lying. Bar lowered to FOREHEAD. Elbows pointing straight up.
  'skull-crusher': (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* bench */}
      <rect x="5" y="30" width="38" height="3" rx="1.5" strokeWidth="1.5"/>
      {/* head */}
      <circle cx="10" cy="26" r="3"/>
      {/* torso */}
      <line x1="13" y1="26" x2="38" y2="27" strokeWidth="2"/>
      {/* legs */}
      <line x1="38" y1="27" x2="42" y2="30"/>
      <line x1="40" y1="27" x2="44" y2="30"/>
      {/* ELBOWS POINTING UP — bar at forehead level */}
      {/* upper arms going UP from shoulders */}
      <line x1="18" y1="25" x2="17" y2="14" strokeWidth="2"/>
      <line x1="22" y1="25" x2="21" y2="14" strokeWidth="2"/>
      {/* forearms angled back over head — bar near head */}
      <line x1="17" y1="14" x2="11" y2="20" strokeWidth="2"/>
      <line x1="21" y1="14" x2="15" y2="20" strokeWidth="2"/>
      {/* barbell at forehead level */}
      <line x1="5" y1="20" x2="21" y2="20" strokeWidth="2.5"/>
      <circle cx="5" cy="20" r="3.5" strokeWidth="1.5"/>
      <circle cx="21" cy="20" r="3.5" strokeWidth="1.5"/>
    </g>
  ),

  // Standing. Elbows locked at sides. Forearms push rope DOWNWARD.
  'pushdown': (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* cable machine top */}
      <rect x="18" y="2" width="12" height="8" rx="2" strokeWidth="1.5"/>
      <line x1="24" y1="10" x2="24" y2="18" strokeWidth="1.5"/>
      {/* figure standing */}
      <circle cx="24" cy="14" r="3"/>
      <line x1="24" y1="17" x2="24" y2="34" strokeWidth="2"/>
      {/* upper arms pinned at sides (elbows at waist) */}
      <line x1="24" y1="22" x2="16" y2="25" strokeWidth="2"/>
      <line x1="24" y1="22" x2="32" y2="25" strokeWidth="2"/>
      {/* forearms going DOWN — cable bar in hands */}
      <line x1="16" y1="25" x2="16" y2="36" strokeWidth="2"/>
      <line x1="32" y1="25" x2="32" y2="36" strokeWidth="2"/>
      {/* bar/rope attachment — horizontal, pushed down */}
      <line x1="13" y1="36" x2="35" y2="36" strokeWidth="2.5"/>
      {/* legs */}
      <line x1="24" y1="34" x2="19" y2="44"/>
      <line x1="24" y1="34" x2="29" y2="44"/>
    </g>
  ),

  // ── LEGS ──────────────────────────────────────────────────────────────────

  // Side view. Deep squat. Knees forward. Bar on upper back.
  'squat': (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* barbell on upper back */}
      <line x1="8" y1="14" x2="40" y2="14" strokeWidth="2.5"/>
      <circle cx="8" cy="14" r="4" strokeWidth="1.5"/>
      <circle cx="40" cy="14" r="4" strokeWidth="1.5"/>
      {/* head */}
      <circle cx="24" cy="10" r="3"/>
      {/* torso — leaning slightly forward in squat */}
      <line x1="24" y1="13" x2="22" y2="28" strokeWidth="2"/>
      {/* thighs — going forward and down (below parallel) */}
      <line x1="22" y1="28" x2="14" y2="36" strokeWidth="2"/>
      <line x1="22" y1="28" x2="30" y2="36" strokeWidth="2"/>
      {/* knees at bottom */}
      {/* shins — going back down to feet */}
      <line x1="14" y1="36" x2="16" y2="44" strokeWidth="2"/>
      <line x1="30" y1="36" x2="32" y2="44" strokeWidth="2"/>
      {/* arms holding bar */}
      <line x1="22" y1="17" x2="14" y2="14" strokeWidth="2"/>
      <line x1="22" y1="17" x2="32" y2="14" strokeWidth="2"/>
    </g>
  ),

  // Reclined at ~40°. Feet on angled platform. Legs pushing.
  'leg-press': (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* seat back — reclined */}
      <line x1="4" y1="42" x2="18" y2="18" strokeWidth="2"/>
      {/* seat base */}
      <line x1="4" y1="42" x2="26" y2="42" strokeWidth="2"/>
      {/* machine frame — press sled at angle */}
      <line x1="20" y1="6" x2="44" y2="24" strokeWidth="2"/>
      {/* sled platform */}
      <rect x="22" y="4" width="14" height="4" rx="1.5" strokeWidth="1.5"
        transform="rotate(30 29 6)"/>
      {/* figure reclined */}
      <circle cx="8" cy="16" r="3"/>
      <line x1="10" y1="18" x2="22" y2="34" strokeWidth="2"/>
      {/* legs extended pushing plate */}
      <line x1="16" y1="28" x2="32" y2="14" strokeWidth="2"/>
      <line x1="19" y1="30" x2="35" y2="16" strokeWidth="2"/>
      {/* knee joint */}
      <circle cx="26" cy="21" r="2" strokeWidth="1.5"/>
      {/* arms on handles */}
      <line x1="8" y1="19" x2="4" y2="24"/>
      <line x1="10" y1="20" x2="14" y2="26"/>
    </g>
  ),

  // Side view. Front foot forward, back foot elevated on bench. Deep lunge.
  'bulgarian-split': (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* rear bench */}
      <rect x="26" y="30" width="18" height="3" rx="1.5" strokeWidth="1.5"/>
      <line x1="28" y1="33" x2="28" y2="42"/>
      <line x1="42" y1="33" x2="42" y2="42"/>
      {/* figure */}
      <circle cx="20" cy="10" r="3"/>
      <line x1="20" y1="13" x2="20" y2="26" strokeWidth="2"/>
      {/* front leg — bent knee, foot forward */}
      <line x1="20" y1="26" x2="12" y2="36" strokeWidth="2"/>
      <line x1="12" y1="36" x2="14" y2="44" strokeWidth="2"/>
      {/* back leg — on bench, knee behind */}
      <line x1="20" y1="26" x2="32" y2="32" strokeWidth="2"/>
      {/* foot on bench */}
      <line x1="32" y1="32" x2="34" y2="30"/>
      {/* arms with dumbbells at sides */}
      <line x1="20" y1="17" x2="13" y2="24" strokeWidth="2"/>
      <line x1="20" y1="17" x2="27" y2="22" strokeWidth="2"/>
      <rect x="9" y="22" width="6" height="3" rx="1" strokeWidth="1.5"/>
      <rect x="25" y="20" width="6" height="3" rx="1" strokeWidth="1.5"/>
    </g>
  ),

  // Seated on machine. Lower leg EXTENDS forward from bent position.
  'leg-extension': (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* machine — seat and upright */}
      <rect x="4" y="22" width="20" height="4" rx="1.5" strokeWidth="1.5"/>
      <line x1="4" y1="26" x2="4" y2="44" strokeWidth="1.5"/>
      <line x1="24" y1="26" x2="24" y2="44" strokeWidth="1.5"/>
      {/* leg pad bar */}
      <line x1="24" y1="36" x2="40" y2="28" strokeWidth="1.5"/>
      <rect x="36" y="26" width="8" height="4" rx="2" strokeWidth="1.5"/>
      {/* seated figure */}
      <circle cx="20" cy="14" r="3"/>
      <line x1="20" y1="17" x2="20" y2="26" strokeWidth="2"/>
      {/* thigh horizontal (seated) */}
      <line x1="20" y1="26" x2="8" y2="26" strokeWidth="2"/>
      {/* shin EXTENDED forward horizontally — touching leg pad */}
      <line x1="8" y1="26" x2="36" y2="28" strokeWidth="2"/>
      {/* arms gripping seat handles */}
      <line x1="20" y1="20" x2="14" y2="24"/>
      <line x1="20" y1="20" x2="26" y2="24"/>
    </g>
  ),

  // Face down on bench. Lower legs curl UPWARD from floor.
  'leg-curl': (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* machine bench */}
      <rect x="4" y="22" width="34" height="4" rx="1.5" strokeWidth="1.5"/>
      <line x1="6" y1="26" x2="6" y2="42"/>
      <line x1="36" y1="26" x2="36" y2="42"/>
      {/* ankle roller (pushed by legs) */}
      <rect x="30" y="14" width="8" height="4" rx="2" strokeWidth="1.5"/>
      <line x1="34" y1="18" x2="34" y2="22"/>
      {/* face-down figure — head left */}
      <circle cx="8" cy="19" r="3"/>
      <line x1="11" y1="19" x2="30" y2="22" strokeWidth="2"/>
      {/* legs bent UP — curling toward glutes */}
      <line x1="30" y1="22" x2="36" y2="22" strokeWidth="2"/>
      <line x1="36" y1="22" x2="34" y2="14" strokeWidth="2"/>
      <line x1="32" y1="22" x2="30" y2="14" strokeWidth="2"/>
      {/* arms bent, hands near head */}
      <line x1="8" y1="19" x2="4" y2="23"/>
    </g>
  ),

  // ── CORE ──────────────────────────────────────────────────────────────────

  // In machine. Torso curling FORWARD against resistance pad.
  'crunch': (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* machine seat */}
      <rect x="14" y="30" width="20" height="4" rx="1.5" strokeWidth="1.5"/>
      <line x1="16" y1="34" x2="14" y2="44"/>
      <line x1="32" y1="34" x2="34" y2="44"/>
      {/* resistance pad arc — pushed down */}
      <line x1="14" y1="16" x2="14" y2="28" strokeWidth="1.5"/>
      <line x1="34" y1="16" x2="34" y2="28" strokeWidth="1.5"/>
      <line x1="14" y1="22" x2="34" y2="22" strokeWidth="2"/>
      {/* seated figure — torso CURLED FORWARD */}
      <circle cx="24" cy="10" r="3"/>
      {/* torso bent forward */}
      <path d="M24 13 Q22 22 20 28" strokeWidth="2"/>
      {/* thighs + knees */}
      <line x1="20" y1="30" x2="10" y2="30" strokeWidth="2"/>
      <line x1="28" y1="30" x2="38" y2="30" strokeWidth="2"/>
      {/* arms holding pad — pushing torso forward */}
      <line x1="24" y1="18" x2="20" y2="22" strokeWidth="2"/>
      <line x1="24" y1="18" x2="28" y2="22" strokeWidth="2"/>
    </g>
  ),

  // ── CALVES ────────────────────────────────────────────────────────────────

  // Standing on toes. Heels lifted. Calf contracted.
  'calf-raise': (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* standing figure */}
      <circle cx="24" cy="8" r="3"/>
      <line x1="24" y1="11" x2="24" y2="28" strokeWidth="2"/>
      <line x1="18" y1="18" x2="30" y2="18" strokeWidth="2"/>
      {/* legs straight down */}
      <line x1="24" y1="28" x2="20" y2="38" strokeWidth="2"/>
      <line x1="24" y1="28" x2="28" y2="38" strokeWidth="2"/>
      {/* RAISED on toes — heels up, balls of feet on ground */}
      <line x1="20" y1="38" x2="20" y2="44" strokeWidth="2"/>
      <line x1="28" y1="38" x2="28" y2="44" strokeWidth="2"/>
      {/* toes pointing — heels clearly raised */}
      <line x1="20" y1="44" x2="14" y2="44"/>
      <line x1="28" y1="44" x2="22" y2="44"/>
      {/* machine shoulder pad (if applicable) */}
      <rect x="12" y="15" width="24" height="4" rx="2" strokeWidth="1.5"/>
    </g>
  ),

  // ── LOWER BACK ────────────────────────────────────────────────────────────

  // Standing, bent forward ~45°. Bar gripped at shin level. Classic deadlift setup.
  'deadlift': (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* barbell on floor */}
      <line x1="6" y1="38" x2="42" y2="38" strokeWidth="2.5"/>
      <circle cx="6" cy="38" r="5" strokeWidth="1.5"/>
      <circle cx="42" cy="38" r="5" strokeWidth="1.5"/>
      {/* figure bent forward — head above bar */}
      <circle cx="28" cy="10" r="3"/>
      {/* torso angled ~45° forward */}
      <line x1="26" y1="13" x2="20" y2="28" strokeWidth="2"/>
      {/* arms hanging straight DOWN gripping bar */}
      <line x1="20" y1="20" x2="18" y2="38" strokeWidth="2"/>
      <line x1="20" y1="20" x2="22" y2="38" strokeWidth="2"/>
      {/* legs — hips above knees, knees slightly bent */}
      <line x1="20" y1="28" x2="18" y2="38" strokeWidth="2"/>
      <line x1="20" y1="28" x2="24" y2="38" strokeWidth="2"/>
      {/* slight knee bend visible */}
      <line x1="18" y1="38" x2="20" y2="44"/>
      <line x1="24" y1="38" x2="26" y2="44"/>
    </g>
  ),

  // ── GENERIC fallback ──────────────────────────────────────────────────────
  'generic': (
    <g strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="10" r="3.5"/>
      <line x1="24" y1="13.5" x2="24" y2="30" strokeWidth="2"/>
      <line x1="16" y1="20" x2="32" y2="20" strokeWidth="2"/>
      <line x1="24" y1="30" x2="18" y2="44"/>
      <line x1="24" y1="30" x2="30" y2="44"/>
    </g>
  ),
};

const NAME_TO_ICON: [RegExp, string][] = [
  [/жим.*лёжа.*штанг|bench.*press|жим.*лёж(?!.*наклон|.*отрицат)/i,          'bench-press'],
  [/наклонной|incline|смите.*наклон/i,                                         'incline-press'],
  [/сведен|бабочк|кроссов|fly/i,                                               'chest-fly'],
  [/подтягив|pullup|chin.up/i,                                                 'pullup'],
  [/верхн.*блок|lat.*pull|lat.*down/i,                                         'lat-pulldown'],
  [/горизонт.*тяг|тяг.*блок.*пояс|seated.*row|cable.*row/i,                   'cable-row'],
  [/гиперэкстен|hyperext/i,                                                    'hyperextension'],
  [/жим.*стоя|жим.*сидя|жим.*смите.*сидя|overhead|ohp/i,                      'overhead-press'],
  [/боков.*подъём|разведен.*гант|lateral.*raise/i,                             'lateral-raise'],
  [/разведен.*кросс|разведен.*среднюю|cable.*lateral/i,                        'lateral-raise'],
  [/тяг.*лиц|face.*pull/i,                                                     'face-pull'],
  [/шраг|shrug/i,                                                              'shrugs'],
  [/подъём.*штанг.*бицепс|barbell.*curl/i,                                     'curl'],
  [/молотк|hammer/i,                                                           'hammer-curl'],
  [/скотт|preacher/i,                                                          'scott-curl'],
  [/супинаци|supination/i,                                                     'curl'],
  [/брусья|dip/i,                                                              'dips'],
  [/французск|skull.crush|из-за.*голов|overhead.*tricep/i,                     'skull-crusher'],
  [/pushdown|разгибан.*трицепс.*канат|жим.*канат.*снизу/i,                     'pushdown'],
  [/узким.*хватом.*трицепс|close.*grip.*bench/i,                               'skull-crusher'],
  [/присед|squat/i,                                                            'squat'],
  [/жим.*ног|leg.*press/i,                                                     'leg-press'],
  [/болгар|split.*squat/i,                                                     'bulgarian-split'],
  [/разгибан.*ног|leg.*ext/i,                                                  'leg-extension'],
  [/сгибан.*ног|leg.*curl/i,                                                   'leg-curl'],
  [/скручив|crunch|ab.*/i,                                                     'crunch'],
  [/подъём.*носк|calf.*raise/i,                                                'calf-raise'],
  [/становая|deadlift/i,                                                       'deadlift'],
];

function resolveIcon(name: string): string {
  for (const [re, key] of NAME_TO_ICON) {
    if (re.test(name)) return key;
  }
  return 'generic';
}

interface Props {
  iconId?: string;
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function ExerciseIcon({ iconId, name, size = 32, className, style }: Props) {
  const key = iconId && ICONS[iconId] ? iconId : resolveIcon(name);
  const icon = ICONS[key] ?? ICONS['generic'];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {icon}
    </svg>
  );
}
