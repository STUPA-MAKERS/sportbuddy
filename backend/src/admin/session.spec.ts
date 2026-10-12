import { hasGroup, readClaim, sign, verify } from './session';

describe('session cookie', () => {
  it('round-trips a signed payload', () => {
    const value = sign({ sub: 'a', exp: Date.now() + 1000 }, 'secret');
    expect(verify<{ sub: string; exp: number }>(value, 'secret')?.sub).toBe('a');
  });

  it('rejects a wrong secret, a tampered body and an expired payload', () => {
    const value = sign({ sub: 'a', exp: Date.now() + 1000 }, 'secret');
    expect(verify(value, 'other')).toBeNull();
    const [, mac] = value.split('.');
    const forged = Buffer.from(JSON.stringify({ sub: 'b', exp: Date.now() + 1000 })).toString('base64url');
    expect(verify(`${forged}.${mac}`, 'secret')).toBeNull();
    expect(verify(sign({ exp: Date.now() - 1 }, 'secret'), 'secret')).toBeNull();
    expect(verify(undefined, 'secret')).toBeNull();
    expect(verify('garbage', 'secret')).toBeNull();
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
