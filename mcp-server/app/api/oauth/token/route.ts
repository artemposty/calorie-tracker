const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Supported client_id — not secret, just identifies this app
const CLIENT_ID = 'calorie-tracker';

export async function POST(request: Request) {
  let clientId: string | null = null;
  let clientSecret: string | null = null;

  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await request.text();
    const params = new URLSearchParams(text);
    clientId = params.get('client_id');
    clientSecret = params.get('client_secret');
    const grantType = params.get('grant_type');
    if (grantType !== 'client_credentials') {
      return Response.json(
        { error: 'unsupported_grant_type' },
        { status: 400, headers: CORS },
      );
    }
  } else {
    // Also accept JSON body
    try {
      const body = (await request.json()) as {
        client_id?: string;
        client_secret?: string;
        grant_type?: string;
      };
      clientId = body.client_id ?? null;
      clientSecret = body.client_secret ?? null;
      if (body.grant_type && body.grant_type !== 'client_credentials') {
        return Response.json(
          { error: 'unsupported_grant_type' },
          { status: 400, headers: CORS },
        );
      }
    } catch {
      return Response.json({ error: 'invalid_request' }, { status: 400, headers: CORS });
    }
  }

  // Also check HTTP Basic auth (client_secret_basic)
  if (!clientSecret) {
    const authHeader = request.headers.get('authorization') ?? '';
    if (authHeader.startsWith('Basic ')) {
      const decoded = atob(authHeader.slice(6));
      const [id, secret] = decoded.split(':');
      clientId = id;
      clientSecret = secret;
    }
  }

  if (!clientId || !clientSecret) {
    return Response.json({ error: 'invalid_client' }, { status: 401, headers: CORS });
  }

  const expectedSecret = process.env.MCP_AUTH_TOKEN!;
  if (clientId !== CLIENT_ID || clientSecret !== expectedSecret) {
    return Response.json({ error: 'invalid_client' }, { status: 401, headers: CORS });
  }

  // Return the same token — stateless, no storage needed
  return Response.json(
    {
      access_token: expectedSecret,
      token_type: 'bearer',
      expires_in: 86400,
    },
    { headers: CORS },
  );
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
