import { createClient } from '@supabase/supabase-js';
import { checkAuth, unauthorized } from '@/lib/api-auth';

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
const USER_ID = () => process.env.NEXT_PUBLIC_USER_ID!;

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const SYSTEM_EXERCISES = [
  // ── Chest ────────────────────────────────────────────────────────────────
  { name: 'Жим штанги лёжа',                          primary_muscle: 'chest',      secondary_muscles: ['triceps','shoulders'],  equipment: 'barbell',    display_order: 1  },
  { name: 'Жим штанги в Смите на наклонной',          primary_muscle: 'chest',      secondary_muscles: ['triceps','shoulders'],  equipment: 'machine',    display_order: 2  },
  { name: 'Жим гантелей на наклонной',                primary_muscle: 'chest',      secondary_muscles: ['triceps','shoulders'],  equipment: 'dumbbell',   display_order: 3  },
  { name: 'Жим штанги лёжа на отрицательном наклоне', primary_muscle: 'chest',      secondary_muscles: ['triceps'],              equipment: 'barbell',    display_order: 4  },
  { name: 'Сведение рук в тренажёре (бабочка)',        primary_muscle: 'chest',      secondary_muscles: [],                       equipment: 'machine',    display_order: 5  },
  { name: 'Сведение рук в кроссовере',                 primary_muscle: 'chest',      secondary_muscles: [],                       equipment: 'cable',      display_order: 6  },
  // ── Back ─────────────────────────────────────────────────────────────────
  { name: 'Подтягивания',                              primary_muscle: 'back',       secondary_muscles: ['biceps','forearms'],    equipment: 'bodyweight', display_order: 10 },
  { name: 'Тяга верхнего блока узким хватом',          primary_muscle: 'back',       secondary_muscles: ['biceps'],               equipment: 'cable',      display_order: 11 },
  { name: 'Тяга верхнего блока широким хватом',        primary_muscle: 'back',       secondary_muscles: ['biceps'],               equipment: 'cable',      display_order: 12 },
  { name: 'Горизонтальная тяга в блоке к поясу',       primary_muscle: 'back',       secondary_muscles: ['biceps'],               equipment: 'cable',      display_order: 13 },
  { name: 'Тяга на прямых руках на верхнем блоке',     primary_muscle: 'back',       secondary_muscles: [],                       equipment: 'cable',      display_order: 14 },
  { name: 'Тяга в рычажном тренажёре сверху',          primary_muscle: 'back',       secondary_muscles: ['biceps'],               equipment: 'machine',    display_order: 15 },
  { name: 'Гиперэкстензия',                            primary_muscle: 'lower_back', secondary_muscles: ['glutes'],               equipment: 'bodyweight', display_order: 16 },
  // ── Shoulders ────────────────────────────────────────────────────────────
  { name: 'Жим гантелей сидя',                         primary_muscle: 'shoulders',  secondary_muscles: ['triceps'],              equipment: 'dumbbell',   display_order: 20 },
  { name: 'Жим штанги в Смите сидя',                   primary_muscle: 'shoulders',  secondary_muscles: ['triceps'],              equipment: 'machine',    display_order: 21 },
  { name: 'Подъём гири перед собой',                   primary_muscle: 'shoulders',  secondary_muscles: [],                       equipment: 'other',      display_order: 22, notes: 'Целевая группа: передняя дельта' },
  { name: 'Разведение в кроссовере на среднюю дельту', primary_muscle: 'shoulders',  secondary_muscles: [],                       equipment: 'cable',      display_order: 23 },
  { name: 'Разведение гантелей на среднюю дельту',     primary_muscle: 'shoulders',  secondary_muscles: [],                       equipment: 'dumbbell',   display_order: 24 },
  { name: 'Тяга каната к голове',                      primary_muscle: 'shoulders',  secondary_muscles: ['back'],                 equipment: 'cable',      display_order: 25 },
  { name: 'Шраги с гантелями',                         primary_muscle: 'shoulders',  secondary_muscles: [],                       equipment: 'dumbbell',   display_order: 26 },
  // ── Biceps ───────────────────────────────────────────────────────────────
  { name: 'Молотки с гантелями стоя',                  primary_muscle: 'biceps',     secondary_muscles: ['forearms'],             equipment: 'dumbbell',   display_order: 30 },
  { name: 'Подъём штанги на бицепс стоя',              primary_muscle: 'biceps',     secondary_muscles: ['forearms'],             equipment: 'barbell',    display_order: 31 },
  { name: 'Подъём штанги на скамье Скотта',            primary_muscle: 'biceps',     secondary_muscles: [],                       equipment: 'barbell',    display_order: 32 },
  { name: 'Подъём в тренажёре Скотта',                 primary_muscle: 'biceps',     secondary_muscles: [],                       equipment: 'machine',    display_order: 33 },
  { name: 'Подъём гантелей с супинацией',              primary_muscle: 'biceps',     secondary_muscles: ['forearms'],             equipment: 'dumbbell',   display_order: 34 },
  // ── Triceps ───────────────────────────────────────────────────────────────
  { name: 'Брусья',                                    primary_muscle: 'triceps',    secondary_muscles: ['chest','shoulders'],    equipment: 'bodyweight', display_order: 40 },
  { name: 'Жим штанги лёжа узким хватом',              primary_muscle: 'triceps',    secondary_muscles: ['chest'],                equipment: 'barbell',    display_order: 41 },
  { name: 'Французский жим с гантелью из-за головы',   primary_muscle: 'triceps',    secondary_muscles: [],                       equipment: 'dumbbell',   display_order: 42 },
  { name: 'Разгибание на трицепс с канатом сверху',    primary_muscle: 'triceps',    secondary_muscles: [],                       equipment: 'cable',      display_order: 43 },
  { name: 'Жим каната снизу вверх',                    primary_muscle: 'triceps',    secondary_muscles: [],                       equipment: 'cable',      display_order: 44 },
  // ── Core ─────────────────────────────────────────────────────────────────
  { name: 'Скручивания в тренажёре',                   primary_muscle: 'core',       secondary_muscles: [],                       equipment: 'machine',    display_order: 50 },
  // ── Legs ─────────────────────────────────────────────────────────────────
  { name: 'Приседания со штангой',                     primary_muscle: 'legs',       secondary_muscles: ['glutes','lower_back'],  equipment: 'barbell',    display_order: 60 },
  { name: 'Болгарские сплит-приседания',               primary_muscle: 'legs',       secondary_muscles: ['glutes'],               equipment: 'dumbbell',   display_order: 61 },
  { name: 'Жим ногами',                                primary_muscle: 'legs',       secondary_muscles: ['glutes'],               equipment: 'machine',    display_order: 62 },
  { name: 'Разгибание ног в тренажёре',                primary_muscle: 'legs',       secondary_muscles: [],                       equipment: 'machine',    display_order: 63 },
  { name: 'Сгибание ног в тренажёре',                  primary_muscle: 'legs',       secondary_muscles: [],                       equipment: 'machine',    display_order: 64 },
  // ── Lower back ───────────────────────────────────────────────────────────
  { name: 'Становая тяга',                             primary_muscle: 'lower_back', secondary_muscles: ['legs','glutes'],        equipment: 'barbell',    display_order: 70 },
  // ── Calves ───────────────────────────────────────────────────────────────
  { name: 'Подъём на носки стоя',                      primary_muscle: 'calves',     secondary_muscles: [],                       equipment: 'machine',    display_order: 80 },
] as const;

export async function POST(request: Request) {
  if (!checkAuth(request)) return unauthorized();

  const userId = USER_ID();
  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get('dry') === '1';

  const { data: existing } = await sb()
    .from('exercises')
    .select('name')
    .eq('user_id', userId)
    .eq('is_system', true);

  const existingNames = new Set((existing ?? []).map(r => r.name as string));
  const toInsert = SYSTEM_EXERCISES.filter(e => !existingNames.has(e.name));

  if (dryRun) {
    return Response.json({ existing: existingNames.size, toInsert: toInsert.map(e => e.name) });
  }

  if (toInsert.length === 0) {
    return Response.json({ inserted: 0, message: 'All system exercises already present' });
  }

  const rows = toInsert.map(e => ({
    id: newId(),
    user_id: userId,
    name: e.name,
    primary_muscle: e.primary_muscle,
    secondary_muscles: [...e.secondary_muscles],
    equipment: e.equipment,
    is_custom: false,
    is_system: true,
    notes: 'notes' in e ? (e as { notes?: string }).notes ?? null : null,
    display_order: e.display_order,
  }));

  const { error } = await sb().from('exercises').insert(rows);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ inserted: rows.length, names: rows.map(r => r.name) });
}
