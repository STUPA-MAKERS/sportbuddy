import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AdminAuthService, AdminUser, SESSION_COOKIE } from './admin-auth.service';

export type AdminRequest = Request & { admin: AdminUser };

/** Lets a request through only with a valid moderator session cookie. */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AdminAuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AdminRequest>();
    const user = this.auth.readSession(req.cookies?.[SESSION_COOKIE]);
    if (!user) throw new UnauthorizedException('Bitte melde dich an.');
    req.admin = user;
    return true;
  }
}
