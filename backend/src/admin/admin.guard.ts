import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AdminAuthService, AdminUser, SESSION_COOKIE } from './admin-auth.service';

export type AdminRequest = Request & { admin: AdminUser };

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Lets a request through only with a valid moderator session cookie. */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AdminAuthService) {}

  /** Null when FRONTEND_URL is not a full URL; then no Origin matches. */
  private frontendOrigin(): string | null {
    try {
      return new URL(this.auth.frontendUrl).origin;
    } catch {
      return null;
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AdminRequest>();
    // SameSite=Lax still sends the cookie from sibling subdomains, so changes must come from our own page.
    const origin = req.headers.origin;
    if (!SAFE_METHODS.has(req.method) && origin !== undefined && origin !== this.frontendOrigin()) {
      throw new ForbiddenException('Ungültige Herkunft der Anfrage.');
    }
    const user = this.auth.readSession(req.cookies?.[SESSION_COOKIE]);
    if (!user) throw new UnauthorizedException('Bitte melde dich an.');
    req.admin = user;
    return true;
  }
}
