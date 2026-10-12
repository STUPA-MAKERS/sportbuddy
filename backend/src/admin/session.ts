import * as crypto from 'crypto';

/** A small signed cookie value: base64url(JSON).base64url(HMAC-SHA256). */
export function sign(payload: object, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${mac}`;
}

/** The payload, or null when the value is malformed, tampered with or expired (`exp` in ms). */
export function verify<T extends { exp: number }>(value: string | undefined, secret: string): T | null {
  if (!value) return null;
  const dot = value.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = value.slice(0, dot);
  const mac = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(crypto.createHmac('sha256', secret).update(body).digest('base64url'));
  if (mac.length !== expected.length || !crypto.timingSafeEqual(mac, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
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
