export const ADMIN_COOKIE_NAME = 'his_admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || 'hisomega-admin-session-v1';
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(getSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signSessionToken(email: string): Promise<string> {
  const payload = JSON.stringify({
    email,
    exp: Date.now() + SESSION_TTL_MS
  });
  const enc = new TextEncoder();
  const payloadB64 = toBase64Url(enc.encode(payload));
  const key = await getHmacKey();
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64));
  const sigB64 = toBase64Url(new Uint8Array(sig));
  return `${payloadB64}.${sigB64}`;
}

export async function verifySessionToken(
  token?: string | null
): Promise<{ email: string; exp: number } | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;

  try {
    const enc = new TextEncoder();
    const key = await getHmacKey();
    const sigBytes = fromBase64Url(sigB64);
    const sigBuffer = new Uint8Array(sigBytes).buffer;
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBuffer,
      enc.encode(payloadB64)
    );
    if (!isValid) return null;

    const payloadJson = new TextDecoder().decode(fromBase64Url(payloadB64));
    const parsed = JSON.parse(payloadJson) as { email?: string; exp?: number };
    if (!parsed.email || !parsed.exp || parsed.exp <= Date.now()) {
      return null;
    }
    return { email: parsed.email, exp: parsed.exp };
  } catch {
    return null;
  }
}
