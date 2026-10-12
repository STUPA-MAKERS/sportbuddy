import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { IconComponent } from '@stupa-makers/ui-kit';
import { catchError, of } from 'rxjs';
import { SymbolComponent } from '../shared/symbol.component';
import { AdminApiService } from './admin-api.service';
import { AdminHeaderComponent } from './admin-header.component';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminHeaderComponent, IconComponent, SymbolComponent],
  styles: [':host{display:flex;flex-direction:column;min-height:100dvh}'],
  template: `
    <app-admin-header />
    <main class="center-main">
      <article class="done" aria-labelledby="li">
        <span class="done-ic"><app-symbol name="admin_panel_settings" [size]="30" [fill]="true" /></span>
        <h1 id="li">Moderation</h1>
        <p class="lead">Nur für das STUPA-Team. Melde dich mit deinem Hochschul-Konto an, um gemeldete Anfragen zu prüfen.</p>
        @if (login() === 'fehler') {
          <div class="note note--err" role="alert" style="width: 100%">
            <app-symbol name="warning" [size]="18" /><span>Die Anmeldung hat nicht geklappt. Bitte versuch es noch einmal.</span>
          </div>
        }
        @if (config()?.enabled === false) {
          <div class="note note--warn" role="status" style="width: 100%">
            <app-symbol name="warning" [size]="18" />
            <span>Die Anmeldung ist auf diesem Server nicht eingerichtet. Es fehlen OIDC_ISSUER, OIDC_CLIENT_ID oder SESSION_SECRET.</span>
          </div>
        } @else {
          <a class="btnlink btnlink--fill btnlink--lg" [href]="href()" style="width: 100%; margin-top: 8px">
            <app-symbol name="login" [size]="20" />Mit STUPA-Login anmelden
          </a>
        }
        <p class="subtle" style="display: flex; align-items: center; gap: 6px">
          <app-icon name="lock" [size]="15" />Du wirst zur Anmeldeseite weitergeleitet (OpenID Connect) und danach zurückgeschickt.
        </p>
      </article>
    </main>
  `,
})
export class AdminLoginComponent {
  private readonly api = inject(AdminApiService);
  readonly returnTo = input<string>();
  readonly login = input<string>();
  protected readonly config = toSignal(this.api.authConfig().pipe(catchError(() => of(null))));
  protected readonly href = computed(() => this.api.loginUrl(this.returnTo() || '/admin'));
}
