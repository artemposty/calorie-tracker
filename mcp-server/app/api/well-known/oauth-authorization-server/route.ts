const CORS = { 'Access-Control-Allow-Origin': '*' };

export async function GET() {
  const base =
    process.env.MCP_BASE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000');

  return Response.json(
    {
      issuer: base,
      token_endpoint: `${base}/api/oauth/token`,
      grant_types_supported: ['client_credentials'],
      token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
      response_types_supported: ['token'],
    },
    { headers: CORS },
  );
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
