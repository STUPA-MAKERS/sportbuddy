import { Controller, Get, HttpCode, Post, Query, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { AdminAuthService, DENIED_COOKIE, LOGIN_COOKIE, SESSION_COOKIE } from './admin-auth.service';

const AUTH_PATH = '/api/admin';

@Controller('api/admin/auth')
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  /** Public facts for the login and 403 pages. */
  @Get('config')
  config() {
    return { enabled: this.auth.enabled, adminGroup: this.auth.adminGroup };
  }

  @Get('login')
  async login(@Query('returnTo') returnTo: string, @Res() res: Response) {
    const { url, transaction } = await this.auth.startLogin(returnTo);
    res.cookie(LOGIN_COOKIE, transaction, this.auth.cookieOptions(this.auth.loginMaxAge, AUTH_PATH));
    res.redirect(url);
  }

  @Get('callback')
  async callback(@Req() req: Request, @Res() res: Response) {
    const result = await this.auth.finishLogin(req, req.cookies?.[LOGIN_COOKIE]);
    res.clearCookie(LOGIN_COOKIE, { path: AUTH_PATH });
    const base = this.auth.frontendUrl;
    if ('reason' in result) {
      if ('denied' in result) {
        res.cookie(DENIED_COOKIE, result.denied, this.auth.cookieOptions(this.auth.loginMaxAge, AUTH_PATH));
        res.redirect(`${base}/admin/kein-zugriff`);
      } else {
        res.redirect(`${base}/admin?login=fehler`);
      }
      return;
    }
    res.clearCookie(DENIED_COOKIE, { path: AUTH_PATH });
    res.cookie(SESSION_COOKIE, result.session, this.auth.cookieOptions(this.auth.sessionMaxAge, AUTH_PATH));
    res.redirect(`${base}${result.returnTo}`);
  }

  @Get('me')
  me(@Req() req: Request) {
    const user = this.auth.readSession(req.cookies?.[SESSION_COOKIE]);
    if (!user) throw new UnauthorizedException('Bitte melde dich an.');
    return { name: user.name, email: user.email };
  }

  /** The account that was refused, for the 403 page (or nulls). */
  @Get('denied')
  denied(@Req() req: Request) {
    return this.auth.readDenied(req.cookies?.[DENIED_COOKIE]) ?? { name: null, email: null };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(SESSION_COOKIE, { path: AUTH_PATH });
    res.clearCookie(DENIED_COOKIE, { path: AUTH_PATH });
    return { logoutUrl: await this.auth.logoutUrl() };
  }
}
