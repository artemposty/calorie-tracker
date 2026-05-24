import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, mcp-session-id, Last-Event-ID, mcp-protocol-version',
  'Access-Control-Expose-Headers': 'mcp-session-id, mcp-protocol-version',
};

function getTrackerUrl() { return process.env.TRACKER_API_URL!; }
function getTrackerToken() { return process.env.TRACKER_API_TOKEN!; }

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function trackerFetch(path: string, options?: RequestInit) {
  const url = `${getTrackerUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getTrackerToken()}`,
      ...options?.headers,
    },
  });
  const body = await res.json();
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  return body;
}

function buildServer(): McpServer {
  const server = new McpServer({
    name: 'calorie-tracker',
    version: '1.0.0',
  });

  // ── add_meals ────────────────────────────────────────────────────────────
  server.registerTool(
    'add_meals',
    {
      description:
        'Add one or more food/meal entries to the calorie tracker. ' +
        'p, f, c must be per 100g — the server multiplies by grams/100 and stores per-portion values.',
      inputSchema: {
        meals: z
          .array(
            z.object({
              name: z.string().describe('Food name'),
              grams: z.number().positive().describe('Portion weight in grams'),
              p: z.number().min(0).describe('Protein per 100g (server converts to per-portion)'),
              f: z.number().min(0).describe('Fat per 100g (server converts to per-portion)'),
              c: z.number().min(0).describe('Carbs per 100g (server converts to per-portion)'),
              date: z
                .string()
                .regex(/^\d{4}-\d{2}-\d{2}$/)
                .optional()
                .describe('Date YYYY-MM-DD (default: today)'),
            }),
          )
          .min(1)
          .describe('Array of meals to add'),
      },
    },
    async ({ meals }) => {
      try {
        const result = await trackerFetch('/api/entries', {
          method: 'POST',
          body: JSON.stringify(meals),
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
        };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: String(e) }] };
      }
    },
  );

  // ── add_weight ───────────────────────────────────────────────────────────
  server.registerTool(
    'add_weight',
    {
      description: 'Record body weight measurement',
      inputSchema: {
        weight: z.number().min(20).max(300).describe('Weight in kilograms'),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe('Date YYYY-MM-DD (default: today)'),
      },
    },
    async ({ weight, date }) => {
      try {
        const result = await trackerFetch('/api/weight', {
          method: 'POST',
          body: JSON.stringify({ weight, date }),
        });
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: String(e) }] };
      }
    },
  );

  // ── get_today_summary ────────────────────────────────────────────────────
  server.registerTool(
    'get_today_summary',
    {
      description:
        "Get today's nutrition summary: calories eaten, macros, remaining until goal, and list of logged meals",
    },
    async () => {
      try {
        const today = getTodayDate();
        const [stats, entries] = await Promise.all([
          trackerFetch(`/api/stats?days=1`),
          trackerFetch(`/api/entries?from=${today}&to=${today}`),
        ]);

        const day = (stats.days as { date: string; kcal: number; p: number; f: number; c: number; weight: number | null }[]).find((d) => d.date === today) ?? {
          kcal: 0, p: 0, f: 0, c: 0, weight: null,
        };
        const goals = stats.goals as { kcal: number; p: number; f: number; c: number };

        const summary = {
          date: today,
          eaten: { kcal: day.kcal, p: day.p, f: day.f, c: day.c },
          goals,
          remaining: {
            kcal: goals.kcal - day.kcal,
            p: Math.round((goals.p - day.p) * 10) / 10,
            f: Math.round((goals.f - day.f) * 10) / 10,
            c: Math.round((goals.c - day.c) * 10) / 10,
          },
          pct: {
            kcal: goals.kcal ? Math.round((day.kcal / goals.kcal) * 100) : 0,
            p: goals.p ? Math.round((day.p / goals.p) * 100) : 0,
          },
          weight_today: day.weight,
          meals: (entries.entries as { id: string; name: string; grams: number; kcal: number; p: number; f: number; c: number }[]).map((e) => ({
            id: e.id,
            name: e.name,
            grams: e.grams,
            kcal: e.kcal,
            p: e.p,
            f: e.f,
            c: e.c,
          })),
        };

        return { content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }] };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: String(e) }] };
      }
    },
  );

  // ── get_stats ────────────────────────────────────────────────────────────
  server.registerTool(
    'get_stats',
    {
      description: 'Get nutrition and weight statistics for the last N days',
      inputSchema: {
        days: z
          .number()
          .int()
          .min(1)
          .max(365)
          .default(7)
          .describe('Number of days to look back (default: 7)'),
      },
    },
    async ({ days }) => {
      try {
        const result = await trackerFetch(`/api/stats?days=${days}`);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: String(e) }] };
      }
    },
  );

  // ── get_entries ──────────────────────────────────────────────────────────
  server.registerTool(
    'get_entries',
    {
      description: 'Get food diary entries for a date range',
      inputSchema: {
        from: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe('Start date YYYY-MM-DD (default: 7 days ago)'),
        to: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe('End date YYYY-MM-DD (default: today)'),
      },
    },
    async ({ from, to }) => {
      try {
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        const result = await trackerFetch(`/api/entries?${params}`);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: String(e) }] };
      }
    },
  );

  // ── delete_entry ─────────────────────────────────────────────────────────
  server.registerTool(
    'delete_entry',
    {
      description: 'Delete a food diary entry by ID',
      inputSchema: {
        id: z.string().describe('Entry ID to delete'),
      },
    },
    async ({ id }) => {
      try {
        const result = await trackerFetch(`/api/entries/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: String(e) }] };
      }
    },
  );

  // ── add_food_item ─────────────────────────────────────────────────────────
  server.registerTool(
    'add_food_item',
    {
      description: 'Add a food item to the personal food database (for quick re-use when logging meals)',
      inputSchema: {
        name: z.string().describe('Food name'),
        p: z.number().min(0).describe('Protein per 100g'),
        f: z.number().min(0).describe('Fat per 100g'),
        c: z.number().min(0).describe('Carbs per 100g'),
        kcal: z.number().min(0).optional().describe('Calories per 100g (calculated from p/f/c if omitted)'),
        default_grams: z.number().positive().optional().describe('Default portion size in grams'),
      },
    },
    async ({ name, p, f, c, kcal, default_grams }) => {
      try {
        const computedKcal = kcal ?? Math.round(p * 4 + f * 9 + c * 4);
        const result = await trackerFetch('/api/foods', {
          method: 'POST',
          body: JSON.stringify({ name, p, f, c, kcal: computedKcal, default_grams }),
        });
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: String(e) }] };
      }
    },
  );

  // ── log_set ──────────────────────────────────────────────────────────────
  server.registerTool(
    'log_set',
    {
      description:
        'Log a single workout set (exercise + weight + reps). ' +
        'Use list_exercises to find the exercise ID first. ' +
        'weight is in kg, reps is an integer, rpe is optional (1-10 scale).',
      inputSchema: {
        exercise_id: z.string().describe('Exercise ID from list_exercises'),
        weight: z.number().min(0).describe('Weight in kg (0 for bodyweight)'),
        reps: z.number().int().min(1).describe('Number of reps'),
        rpe: z.number().min(1).max(10).optional().describe('Rate of Perceived Exertion (1-10)'),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe('Date YYYY-MM-DD (default: today)'),
        notes: z.string().optional().describe('Optional notes for this set'),
      },
    },
    async ({ exercise_id, weight, reps, rpe, date, notes }) => {
      try {
        const result = await trackerFetch('/api/sets', {
          method: 'POST',
          body: JSON.stringify({ exerciseId: exercise_id, weight, reps, rpe, date, notes }),
        });
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: String(e) }] };
      }
    },
  );

  // ── get_today_workout ─────────────────────────────────────────────────────
  server.registerTool(
    'get_today_workout',
    {
      description:
        "Get today's workout: sets grouped by exercise, total tonnage, and this-week muscle volume summary.",
    },
    async () => {
      try {
        const result = await trackerFetch('/api/training/dashboard');
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: String(e) }] };
      }
    },
  );

  // ── get_last_session ─────────────────────────────────────────────────────
  server.registerTool(
    'get_last_session',
    {
      description: 'Get the sets from the most recent session for a given exercise (useful for progressive overload hints).',
      inputSchema: {
        exercise_id: z.string().describe('Exercise ID'),
      },
    },
    async ({ exercise_id }) => {
      try {
        const result = await trackerFetch(`/api/training/last-session?exercise_id=${encodeURIComponent(exercise_id)}`);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: String(e) }] };
      }
    },
  );

  // ── get_exercise_progress ─────────────────────────────────────────────────
  server.registerTool(
    'get_exercise_progress',
    {
      description:
        'Get e1RM (estimated 1-rep max via Epley formula) progress over time for an exercise. Returns per-session best e1RM and all-time PR.',
      inputSchema: {
        exercise_id: z.string().describe('Exercise ID'),
        days: z
          .number()
          .int()
          .min(1)
          .max(365)
          .default(90)
          .describe('Look-back window in days (default: 90)'),
      },
    },
    async ({ exercise_id, days }) => {
      try {
        const result = await trackerFetch(
          `/api/training/exercise-progress?exercise_id=${encodeURIComponent(exercise_id)}&days=${days}`,
        );
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: String(e) }] };
      }
    },
  );

  // ── get_weekly_volume ─────────────────────────────────────────────────────
  server.registerTool(
    'get_weekly_volume',
    {
      description:
        'Get weekly training volume per muscle group (sets and tonnage). Primary muscle = 1.0 set, secondary = 0.5 set.',
      inputSchema: {
        weeks: z
          .number()
          .int()
          .min(1)
          .max(12)
          .default(1)
          .describe('Number of weeks to include (default: 1 = current week)'),
      },
    },
    async ({ weeks }) => {
      try {
        const result = await trackerFetch(`/api/training/weekly-volume?weeks=${weeks}`);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: String(e) }] };
      }
    },
  );

  // ── list_exercises ────────────────────────────────────────────────────────
  server.registerTool(
    'list_exercises',
    {
      description: 'List all available exercises (system + custom). Returns id, name, primaryMuscle, equipment.',
    },
    async () => {
      try {
        const result = await trackerFetch('/api/exercises');
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: String(e) }] };
      }
    },
  );

  // ── add_exercise ──────────────────────────────────────────────────────────
  server.registerTool(
    'add_exercise',
    {
      description: 'Add a custom exercise to the exercise library.',
      inputSchema: {
        name: z.string().describe('Exercise name'),
        primary_muscle: z
          .enum(['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core', 'calves', 'forearms', 'lower_back'])
          .describe('Primary muscle group'),
        secondary_muscles: z
          .array(z.enum(['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core', 'calves', 'forearms', 'lower_back']))
          .optional()
          .describe('Secondary muscle groups'),
        equipment: z
          .enum(['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other'])
          .optional()
          .describe('Equipment type (default: other)'),
        notes: z.string().optional().describe('Optional notes'),
      },
    },
    async ({ name, primary_muscle, secondary_muscles, equipment, notes }) => {
      try {
        const result = await trackerFetch('/api/exercises', {
          method: 'POST',
          body: JSON.stringify({
            name,
            primaryMuscle: primary_muscle,
            secondaryMuscles: secondary_muscles ?? [],
            equipment: equipment ?? 'other',
            notes,
          }),
        });
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: String(e) }] };
      }
    },
  );

  // ── resources ────────────────────────────────────────────────────────────
  server.registerResource(
    'today-summary',
    'nutrition://today',
    { description: "Live view of today's nutrition progress" },
    async () => {
      const today = getTodayDate();
      const [stats, entries] = await Promise.all([
        trackerFetch(`/api/stats?days=1`),
        trackerFetch(`/api/entries?from=${today}&to=${today}`),
      ]);
      return {
        contents: [{
          uri: 'nutrition://today',
          mimeType: 'application/json',
          text: JSON.stringify({ stats, entries }, null, 2),
        }],
      };
    },
  );

  server.registerResource(
    'goals',
    'nutrition://goals',
    { description: 'Daily nutrition goals (kcal, protein, fat, carbs)' },
    async () => {
      const stats = await trackerFetch('/api/stats?days=1');
      return {
        contents: [{
          uri: 'nutrition://goals',
          mimeType: 'application/json',
          text: JSON.stringify(stats.goals, null, 2),
        }],
      };
    },
  );

  return server;
}

// ── Route handlers ────────────────────────────────────────────────────────

function checkMcpAuth(request: Request): boolean {
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return Boolean(token && token === process.env.MCP_AUTH_TOKEN);
}

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  if (!checkMcpAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const transport = new WebStandardStreamableHTTPServerTransport();
  const server = buildServer();
  await server.connect(transport);
  const response = await transport.handleRequest(request);
  return withCors(response);
}

export async function GET(request: Request) {
  if (!checkMcpAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const transport = new WebStandardStreamableHTTPServerTransport();
  const server = buildServer();
  await server.connect(transport);
  const response = await transport.handleRequest(request);
  return withCors(response);
}

export async function DELETE(request: Request) {
  if (!checkMcpAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const transport = new WebStandardStreamableHTTPServerTransport();
  const server = buildServer();
  await server.connect(transport);
  const response = await transport.handleRequest(request);
  return withCors(response);
}
