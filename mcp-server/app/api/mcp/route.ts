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
      description: 'Add one or more food/meal entries to the calorie tracker',
      inputSchema: {
        meals: z
          .array(
            z.object({
              name: z.string().describe('Food name'),
              grams: z.number().positive().describe('Portion weight in grams'),
              p: z.number().min(0).describe('Protein per 100g'),
              f: z.number().min(0).describe('Fat per 100g'),
              c: z.number().min(0).describe('Carbs per 100g'),
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
