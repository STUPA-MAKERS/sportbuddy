import { hasGroup, readClaim, sign, verify } from './session';

describe('session cookie', () => {
  it('round-trips a signed payload', () => {
    const value = sign({ sub: 'a', exp: Date.now() + 1000 }, 'secret', 'session');
    expect(verify<{ sub: string; exp: number }>(value, 'secret', 'session')?.sub).toBe('a');
  });

  it('rejects a wrong secret, a tampered body and an expired payload', () => {
    const value = sign({ sub: 'a', exp: Date.now() + 1000 }, 'secret', 'session');
    expect(verify(value, 'other', 'session')).toBeNull();
    const [, mac] = value.split('.');
    const forged = Buffer.from(JSON.stringify({ sub: 'b', exp: Date.now() + 1000 })).toString('base64url');
    expect(verify(`${forged}.${mac}`, 'secret', 'session')).toBeNull();
    expect(verify(sign({ exp: Date.now() - 1 }, 'secret', 'session'), 'secret', 'session')).toBeNull();
    expect(verify(undefined, 'secret', 'session')).toBeNull();
    expect(verify('garbage', 'secret', 'session')).toBeNull();
  });
});

describe('cookie purpose', () => {
  it('never accepts a login or denied cookie as a session', () => {
    const exp = Date.now() + 1000;
    const login = sign({ state: 's', nonce: 'n', verifier: 'v', returnTo: '/admin', exp }, 'secret', 'login');
    const denied = sign({ name: 'x', email: null, exp }, 'secret', 'denied');
    expect(verify(login, 'secret', 'session')).toBeNull();
    expect(verify(denied, 'secret', 'session')).toBeNull();
    expect(verify(login, 'secret', 'login')).not.toBeNull();
  });
});

describe('admin group', () => {
  it('reads nested claims', () => {
    expect(readClaim({ realm_access: { roles: ['x'] } }, 'realm_access.roles')).toEqual(['x']);
    expect(readClaim({}, 'groups')).toBeUndefined();
  });

  it('matches arrays, strings and Keycloak group paths', () => {
    expect(hasGroup(['STUPA.Sportbuddy.Admin'], 'STUPA.Sportbuddy.Admin')).toBe(true);
    expect(hasGroup(['/STUPA.Sportbuddy.Admin'], 'STUPA.Sportbuddy.Admin')).toBe(true);
    expect(hasGroup('users STUPA.Sportbuddy.Admin', 'STUPA.Sportbuddy.Admin')).toBe(true);
    expect(hasGroup(['STUPA.Sportbuddy.Admins'], 'STUPA.Sportbuddy.Admin')).toBe(false);
    expect(hasGroup(undefined, 'STUPA.Sportbuddy.Admin')).toBe(false);
  });
});
