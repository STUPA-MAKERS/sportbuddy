import * as crypto from 'crypto';

/** What a signed value is for. Part of the MAC, so a value signed for one purpose never verifies as another. */
export type Purpose = 'session' | 'login' | 'denied';

function mac(body: string, secret: string, purpose: Purpose): string {
  return crypto.createHmac('sha256', secret).update(`${purpose}.${body}`).digest('base64url');
}

/** A small signed cookie value: base64url(JSON).base64url(HMAC-SHA256 over purpose and body). */
export function sign(payload: object, secret: string, purpose: Purpose): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${mac(body, secret, purpose)}`;
}

/** The payload, or null when the value is malformed, tampered with or expired (`exp` in ms). */
export function verify<T extends { exp: number }>(
  value: string | undefined,
  secret: string,
  purpose: Purpose,
): T | null {
  if (!value) return null;
  const dot = value.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = value.slice(0, dot);
  const given = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(mac(body, secret, purpose));
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
    if (!payload || typeof payload !== 'object' || typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Reads a claim by dot path, e.g. `groups` or `realm_access.roles`. */
export function readClaim(claims: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>(
    (value, key) => (value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined),
    claims,
  );
}

/**
 * True when the groups claim contains `group`. Accepts an array or a space/comma separated
 * string, and group paths with a leading slash (Keycloak's "full group path").
 */
export function hasGroup(claim: unknown, group: string): boolean {
  const values = Array.isArray(claim)
    ? claim.map(String)
    : typeof claim === 'string'
      ? claim.split(/[\s,]+/)
      : [];
  const wanted = group.trim().replace(/^\//, '');
  return values.some((v) => v.trim().replace(/^\//, '') === wanted);
}
