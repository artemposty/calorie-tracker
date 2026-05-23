// Stateless PKCE-based authorization code helpers.
// code = base64url(JSON payload) + "." + base64url(HMAC-SHA256 over the payload)

function getSecret(): Uint8Array {
  const s = process.env.MCP_AUTH_TOKEN;
  if (!s) throw new Error('MCP_AUTH_TOKEN not set');
  return new TextEncoder().encode(s);
}

export async function generateCode(codeChallenge: string, redirectUri: string): Promise<string> {
  const payload = JSON.stringify({
    challenge: codeChallenge,
    redirect_uri: redirectUri,
    exp: Date.now() + 10 * 60 * 1000,
  });
  const payloadB64 = b64url(new TextEncoder().encode(payload));
  const sig = await hmacSha256(getSecret(), payloadB64);
  return `${payloadB64}.${b64url(sig)}`;
}

export async function verifyCode(
  code: string,
  codeVerifier: string,
  redirectUri: string | null,
): Promise<boolean> {
  const dotIdx = code.lastIndexOf('.');
  if (dotIdx < 1) return false;
  const payloadB64 = code.slice(0, dotIdx);
  const sigB64 = code.slice(dotIdx + 1);

  // Verify HMAC
  const expectedSig = await hmacSha256(getSecret(), payloadB64);
  if (b64url(expectedSig) !== sigB64) return false;

  let payload: { challenge: string; redirect_uri: string; exp: number };
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64)));
  } catch {
    return false;
  }

  if (Date.now() > payload.exp) return false;
  // Only validate redirect_uri if client provided it in the token request
  if (redirectUri && payload.redirect_uri !== redirectUri) return false;

  // PKCE: SHA256(code_verifier) must equal the stored code_challenge
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
  const computedChallenge = b64url(new Uint8Array(digest));
  return computedChallenge === payload.challenge;
}

async function hmacSha256(key: Uint8Array, data: string): Promise<Uint8Array> {
  const keyBuf = key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer;
  const cryptoKey = await crypto.subtle.importKey('raw', keyBuf, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

function b64url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function b64urlDecode(s: string): Uint8Array {
  const pad = (4 - (s.length % 4)) % 4;
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad);
  const bin = atob(padded);
  return new Uint8Array(bin.length).map((_, i) => bin.charCodeAt(i));
}
