import { verifyCode } from '../../../../lib/oauth';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const CLIENT_ID = 'calorie-tracker';

export async function POST(request: Request) {
  let params: URLSearchParams;

  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/x-www-form-urlencoded')) {
    params = new URLSearchParams(await request.text());
  } else {
    try {
      const body = (await request.json()) as Record<string, string>;
      params = new URLSearchParams(body);
    } catch {
      return Response.json({ error: 'invalid_request' }, { status: 400, headers: CORS });
    }
  }

  // HTTP Basic auth fallback for client_id/client_secret
  let clientId = params.get('client_id');
  let clientSecret = params.get('client_secret');
  const authHeader = request.headers.get('authorization') ?? '';
  if (authHeader.startsWith('Basic ') && !clientSecret) {
    const decoded = atob(authHeader.slice(6));
    const [id, secret] = decoded.split(':');
    clientId = id;
    clientSecret = secret;
  }

  const grantType = params.get('grant_type');

  if (grantType === 'authorization_code') {
    const code = params.get('code');
    const codeVerifier = params.get('code_verifier');
    const redirectUri = params.get('redirect_uri');

    console.log('[token] authorization_code grant', { hasCode: !!code, hasVerifier: !!codeVerifier, redirectUri });

    if (!code || !codeVerifier) {
      console.log('[token] missing code or code_verifier');
      return Response.json({ error: 'invalid_request' }, { status: 400, headers: CORS });
    }

    let valid = false;
    try {
      valid = await verifyCode(code, codeVerifier, redirectUri);
    } catch (e) {
      console.error('[token] verifyCode threw:', e);
    }
    console.log('[token] verifyCode result:', valid);
    if (!valid) {
      return Response.json({ error: 'invalid_grant' }, { status: 400, headers: CORS });
    }

    return Response.json(
      {
        access_token: process.env.MCP_AUTH_TOKEN!,
        token_type: 'bearer',
        expires_in: 86400,
      },
      { headers: CORS },
    );
  }

  if (grantType === 'client_credentials') {
    if (!clientId || !clientSecret) {
      return Response.json({ error: 'invalid_client' }, { status: 401, headers: CORS });
    }
    if (clientId !== CLIENT_ID || clientSecret !== process.env.MCP_AUTH_TOKEN!) {
      return Response.json({ error: 'invalid_client' }, { status: 401, headers: CORS });
    }
    return Response.json(
      {
        access_token: process.env.MCP_AUTH_TOKEN!,
        token_type: 'bearer',
        expires_in: 86400,
      },
      { headers: CORS },
    );
  }

  return Response.json({ error: 'unsupported_grant_type' }, { status: 400, headers: CORS });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
