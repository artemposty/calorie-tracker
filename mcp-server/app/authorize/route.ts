import { generateCode } from '../../lib/oauth';

const CLIENT_ID = 'calorie-tracker';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const responseType = url.searchParams.get('response_type');
  const clientId = url.searchParams.get('client_id');
  const redirectUri = url.searchParams.get('redirect_uri') ?? '';
  const codeChallenge = url.searchParams.get('code_challenge') ?? '';
  const codeChallengeMethod = url.searchParams.get('code_challenge_method');
  const state = url.searchParams.get('state') ?? '';

  if (responseType !== 'code' || clientId !== CLIENT_ID || codeChallengeMethod !== 'S256' || !codeChallenge) {
    return new Response('Invalid request', { status: 400 });
  }

  const params = new URLSearchParams({
    response_type: responseType,
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod,
    state,
  });

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Подключение к Calorie Tracker</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 40px 36px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      text-align: center;
    }
    .icon {
      width: 72px; height: 72px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 18px;
      margin: 0 auto 24px;
      display: flex; align-items: center; justify-content: center;
      font-size: 36px;
    }
    h1 { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 8px; }
    p { font-size: 15px; color: #555; margin-bottom: 28px; line-height: 1.5; }
    .app { font-weight: 600; color: #667eea; }
    .perms {
      background: #f8f9ff;
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 28px;
      text-align: left;
    }
    .perm {
      display: flex; align-items: center; gap: 10px;
      font-size: 14px; color: #333;
      padding: 6px 0;
    }
    .perm:not(:last-child) { border-bottom: 1px solid #eef0f8; }
    .perm-icon { font-size: 18px; flex-shrink: 0; }
    button {
      width: 100%; padding: 14px;
      border-radius: 14px; border: none;
      font-size: 16px; font-weight: 600;
      cursor: pointer; transition: opacity 0.15s;
    }
    button:hover { opacity: 0.88; }
    .btn-allow {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; margin-bottom: 12px;
    }
    .btn-deny {
      background: #f1f3f5; color: #555;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🥗</div>
    <h1>Подключение к Calorie Tracker</h1>
    <p><span class="app">claude.ai</span> запрашивает доступ к вашему дневнику питания.</p>
    <div class="perms">
      <div class="perm"><span class="perm-icon">📖</span> Просмотр записей о питании и весе</div>
      <div class="perm"><span class="perm-icon">✏️</span> Добавление приёмов пищи</div>
      <div class="perm"><span class="perm-icon">📊</span> Просмотр статистики</div>
    </div>
    <form method="POST">
      <input type="hidden" name="params" value="${encodeURIComponent(params.toString())}" />
      <button type="submit" name="action" value="allow" class="btn-allow">Разрешить доступ</button>
      <button type="submit" name="action" value="deny" class="btn-deny">Отклонить</button>
    </form>
  </div>
</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export async function POST(request: Request) {
  const body = await request.text();
  const form = new URLSearchParams(body);
  const action = form.get('action');
  const rawParams = form.get('params');

  if (!rawParams) return new Response('Bad request', { status: 400 });

  const params = new URLSearchParams(decodeURIComponent(rawParams));
  const redirectUri = params.get('redirect_uri') ?? '';
  const state = params.get('state') ?? '';

  if (action === 'deny') {
    const dest = new URL(redirectUri);
    dest.searchParams.set('error', 'access_denied');
    if (state) dest.searchParams.set('state', state);
    return Response.redirect(dest.toString(), 302);
  }

  if (action !== 'allow') return new Response('Bad request', { status: 400 });

  const codeChallenge = params.get('code_challenge') ?? '';
  if (!codeChallenge) return new Response('Missing code_challenge', { status: 400 });

  const code = await generateCode(codeChallenge, redirectUri);

  const dest = new URL(redirectUri);
  dest.searchParams.set('code', code);
  if (state) dest.searchParams.set('state', state);

  return Response.redirect(dest.toString(), 302);
}
