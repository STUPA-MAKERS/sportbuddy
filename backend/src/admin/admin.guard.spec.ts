import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AdminGuard } from './admin.guard';

function context(
  method: string,
  origin?: string,
  cookie = 'valid',
): ExecutionContext {
  const req = {
    method,
    headers: origin ? { origin } : {},
    cookies: { sb_admin: cookie },
  };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
  const auth = {
    frontendUrl: 'https://sportbuddy.example.org',
    readSession: (c: string) =>
      c === 'valid'
        ? { sub: 'a', name: 'A', email: null, exp: Date.now() + 1000 }
        : null,
  } as unknown as AdminAuthService;
  const guard = new AdminGuard(auth);

  it('lets reads and same-origin changes through', () => {
    expect(guard.canActivate(context('GET', 'https://evil.example'))).toBe(
      true,
    );
    expect(
      guard.canActivate(context('POST', 'https://sportbuddy.example.org')),
    ).toBe(true);
    expect(guard.canActivate(context('DELETE'))).toBe(true);
  });

  it('refuses changes from another origin', () => {
    expect(() =>
      guard.canActivate(context('POST', 'https://other.example.org')),
    ).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context('PUT', 'null'))).toThrow(
      ForbiddenException,
    );
  });

  it('needs a session', () => {
    expect(() =>
      guard.canActivate(context('GET', undefined, 'forged')),
    ).toThrow(UnauthorizedException);
  });
});
