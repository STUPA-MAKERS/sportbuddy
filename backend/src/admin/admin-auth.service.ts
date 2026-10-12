import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Issuer, generators } from 'openid-client';
import { SettingsService } from '../settings/settings.service';
import { hasGroup, readClaim, sign, verify } from './session';

export const SESSION_COOKIE = 'sb_admin';
export const LOGIN_COOKIE = 'sb_oidc';
/** Who tried to sign in without the group, for the 403 page. */
export const DENIED_COOKIE = 'sb_denied';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const LOGIN_TTL_MS = 10 * 60 * 1000;
/** Anyone who knows the secret can sign a session, so a short or sample value must not work. */
const MIN_SECRET_LENGTH = 32;

export interface AdminUser {
  sub: string;
  name: string;
  email: string | null;
  exp: number;
}

interface LoginTransaction {
  state: string;
  nonce: string;
  verifier: string;
  returnTo: string;
  exp: number;
}

export type CallbackResult =
  | { ok: true; session: string; returnTo: string }
  | { ok: false; reason: 'forbidden'; denied: string }
  | { ok: false; reason: 'failed' };

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);
  private client: Promise<Client> | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly settings: SettingsService,
  ) {
    if (this.config.get<string>('SESSION_SECRET') && !this.secret) {
      this.logger.error(
        `SESSION_SECRET ist zu kurz oder ein Beispielwert (mindestens ${MIN_SECRET_LENGTH} zufällige Zeichen). Die Anmeldung bleibt aus.`,
      );
    }
  }

  get enabled(): boolean {
    return !!(this.config.get('OIDC_ISSUER') && this.config.get('OIDC_CLIENT_ID') && this.secret);
  }

  /** The IdP group that grants access. Set with OIDC_ADMIN_GROUP. */
  get adminGroup(): string {
    return this.config.get<string>('OIDC_ADMIN_GROUP') || 'STUPA.Sportbuddy.Admin';
  }

  private get groupsClaim(): string {
    return this.config.get<string>('OIDC_GROUPS_CLAIM') || 'groups';
  }

  private get secret(): string {
    const secret = this.config.get<string>('SESSION_SECRET') || '';
    return secret.length >= MIN_SECRET_LENGTH && !/changeme/i.test(secret) ? secret : '';
  }

  get frontendUrl(): string {
    return (this.config.get<string>('FRONTEND_URL') || 'http://localhost:4200').replace(/\/$/, '');
  }

  get redirectUri(): string {
    return this.config.get<string>('OIDC_REDIRECT_URI') || `${this.frontendUrl}/api/admin/auth/callback`;
  }

  get secureCookies(): boolean {
    return this.frontendUrl.startsWith('https://');
  }

  private getClient(): Promise<Client> {
    if (!this.enabled) throw new ServiceUnavailableException('Die Anmeldung ist nicht eingerichtet.');
    if (!this.client) {
      this.client = Issuer.discover(this.config.get<string>('OIDC_ISSUER'))
        .then(
          (issuer) =>
            new issuer.Client({
              client_id: this.config.get<string>('OIDC_CLIENT_ID'),
              client_secret: this.config.get<string>('OIDC_CLIENT_SECRET') || undefined,
              redirect_uris: [this.redirectUri],
              response_types: ['code'],
              token_endpoint_auth_method: this.config.get<string>('OIDC_CLIENT_SECRET')
                ? 'client_secret_basic'
                : 'none',
            }),
        )
        .catch((error) => {
          this.client = null;
          this.logger.error('OIDC discovery fehlgeschlagen', error);
          throw new ServiceUnavailableException('Der Anmeldedienst ist nicht erreichbar.');
        });
    }
    return this.client;
  }

  /** Only paths inside the admin area, so the login cannot redirect elsewhere. */
  safeReturnTo(raw: unknown): string {
    return typeof raw === 'string' && /^\/admin(\/[\w\-/]*)?$/.test(raw) ? raw : '/admin';
  }

  async startLogin(returnTo: unknown): Promise<{ url: string; transaction: string }> {
    const client = await this.getClient();
    const tx: LoginTransaction = {
      state: generators.state(),
      nonce: generators.nonce(),
      verifier: generators.codeVerifier(),
      returnTo: this.safeReturnTo(returnTo),
      exp: Date.now() + LOGIN_TTL_MS,
    };
    const url = client.authorizationUrl({
      scope: this.config.get<string>('OIDC_SCOPES') || 'openid profile email',
      code_challenge: generators.codeChallenge(tx.verifier),
      code_challenge_method: 'S256',
      state: tx.state,
      nonce: tx.nonce,
    });
    return { url, transaction: sign(tx, this.secret, 'login') };
  }

  async finishLogin(
    req: Parameters<Client['callbackParams']>[0],
    transactionCookie: string | undefined,
  ): Promise<CallbackResult> {
    const tx = verify<LoginTransaction>(transactionCookie, this.secret, 'login');
    if (!tx) return { ok: false, reason: 'failed' };
    try {
      const client = await this.getClient();
      const params = client.callbackParams(req);
      const tokens = await client.callback(this.redirectUri, params, {
        state: tx.state,
        nonce: tx.nonce,
        code_verifier: tx.verifier,
      });
      let claims: Record<string, unknown> = { ...tokens.claims() };
      if (readClaim(claims, this.groupsClaim) === undefined && tokens.access_token) {
        const info = await client.userinfo(tokens.access_token);
        // Userinfo must describe the person the ID token was issued for.
        if (info.sub !== claims.sub) throw new Error('userinfo sub mismatch');
        claims = { ...claims, ...info };
      }
      if (!hasGroup(readClaim(claims, this.groupsClaim), this.adminGroup)) {
        this.logger.warn(`Anmeldung ohne Gruppe ${this.adminGroup}: ${String(claims.sub)}`);
        if (claims.sub) await this.bookkeeping(() => this.settings.forgetModerator(String(claims.sub)));
        const denied = sign(
          { name: String(claims.name || claims.preferred_username || ''), email: claims.email ?? null, exp: Date.now() + LOGIN_TTL_MS },
          this.secret,
          'denied',
        );
        return { ok: false, reason: 'forbidden', denied };
      }
      const user: AdminUser = {
        sub: String(claims.sub),
        name: String(claims.name || claims.preferred_username || claims.email || claims.sub),
        email: typeof claims.email === 'string' ? claims.email : null,
        exp: Date.now() + SESSION_TTL_MS,
      };
      await this.bookkeeping(() => this.settings.recordModerator(user));
      return { ok: true, session: sign(user, this.secret, 'session'), returnTo: tx.returnTo };
    } catch (error) {
      this.logger.error('OIDC-Callback fehlgeschlagen', error);
      return { ok: false, reason: 'failed' };
    }
  }

  /** The moderator list must never decide whether a login works. */
  private async bookkeeping(task: () => Promise<void>) {
    try {
      await task();
    } catch (error) {
      this.logger.warn(`Moderatorenliste nicht aktualisiert: ${String(error)}`);
    }
  }

  readDenied(cookie: string | undefined): { name: string; email: string | null } | null {
    if (!this.secret) return null;
    const value = verify<{ name: string; email: string | null; exp: number }>(cookie, this.secret, 'denied');
    return value ? { name: value.name, email: value.email } : null;
  }

  readSession(cookie: string | undefined): AdminUser | null {
    if (!this.secret) return null;
    const user = verify<AdminUser>(cookie, this.secret, 'session');
    return user && typeof user.sub === 'string' && user.sub ? user : null;
  }

  async logoutUrl(): Promise<string | null> {
    try {
      const client = await this.getClient();
      if (!client.issuer.metadata.end_session_endpoint) return null;
      return client.endSessionUrl({ post_logout_redirect_uri: `${this.frontendUrl}/admin` });
    } catch {
      return null;
    }
  }

  cookieOptions(maxAge: number, path: string) {
    return { httpOnly: true, sameSite: 'lax' as const, secure: this.secureCookies, maxAge, path };
  }

  get sessionMaxAge() {
    return SESSION_TTL_MS;
  }

  get loginMaxAge() {
    return LOGIN_TTL_MS;
  }
}
