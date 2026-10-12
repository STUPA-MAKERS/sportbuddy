import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IconComponent } from '@stupa-makers/ui-kit';
import { SymbolComponent } from '../shared/symbol.component';
import { ThemeService } from '../shared/theme.service';
import { AdminApiService } from './admin-api.service';

/** Signed-in frame: the STUPA-Workflow navigation rail beside the page. */
@Component({
  selector: 'app-admin-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, SymbolComponent],
  styles: [
    `.menu{position:absolute;left:84px;bottom:16px;z-index:var(--z-dropdown);min-width:240px;padding:8px;border-radius:var(--radius-lg);background:var(--color-surface-1);box-shadow:var(--shadow-elevated);display:flex;flex-direction:column;gap:2px}
     .menu-who{padding:8px 12px 10px;display:flex;flex-direction:column}
     .menu button{display:flex;align-items:center;gap:12px;height:40px;padding:0 12px;border:0;border-radius:var(--radius-md);background:none;color:var(--color-text);font:inherit;cursor:pointer;text-align:left}
     .menu button:hover{background:var(--color-surface-2)}
     .acct{position:relative}
     @media (max-width:768px){.menu{left:auto;right:8px;bottom:88px;position:fixed}}`,
  ],
  template: `
    <div class="frame">
      <nav class="rail" aria-label="Verwaltung">
        <a class="rail-brand" routerLink="/admin/moderation" aria-label="Sportbuddy Verwaltung"><img src="/stupa-mark.svg" alt="" /></a>
        <a class="rail-item" routerLink="/admin/moderation" routerLinkActive="on" #rla="routerLinkActive" ariaCurrentWhenActive="page">
          <span class="rail-ind">
            <app-symbol name="flag" [size]="22" [fill]="rla.isActive" />
            @if (api.reviewCount() > 0) { <span class="rail-badge num">{{ api.reviewCount() }}</span> }
          </span>
          Moderation
        </a>
        <a class="rail-item" routerLink="/admin/einstellungen" routerLinkActive="on" ariaCurrentWhenActive="page">
          <span class="rail-ind"><app-icon name="tune" [size]="22" /></span>Einstellungen
        </a>
        <a class="rail-item" routerLink="/">
          <span class="rail-ind"><app-symbol name="public" [size]="22" /></span>Zur Seite
        </a>
        <span class="rail-sp"></span>
        <div class="acct">
          <button class="avatar" type="button" [attr.aria-expanded]="menu()" aria-haspopup="menu" [attr.aria-label]="'Konto: ' + (api.user()?.name ?? '')" (click)="menu.set(!menu())">
            {{ initials() }}
          </button>
          @if (menu()) {
            <div class="menu" role="menu">
              <div class="menu-who">
                <strong class="ell">{{ api.user()?.name }}</strong>
                @if (api.user()?.email) { <span class="subtle ell">{{ api.user()?.email }}</span> }
              </div>
              <button role="menuitem" type="button" (click)="theme.toggle()">
                <app-symbol [name]="theme.theme() === 'dark' ? 'light_mode' : 'dark_mode'" [size]="18" />
                {{ theme.theme() === 'dark' ? 'Helles Thema' : 'Dunkles Thema' }}
              </button>
              <button role="menuitem" type="button" (click)="logout()"><app-icon name="logout" [size]="18" />Abmelden</button>
            </div>
          }
        </div>
      </nav>
      <router-outlet />
    </div>
  `,
})
export class AdminShellComponent {
  protected readonly api = inject(AdminApiService);
  protected readonly theme = inject(ThemeService);
  protected readonly menu = signal(false);

  protected initials() {
    const name = this.api.user()?.name ?? '';
    const parts = name.replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
  }

  protected logout() {
    this.api.logout().subscribe({
      next: ({ logoutUrl }) => (location.href = logoutUrl ?? '/admin/anmelden'),
      error: () => (location.href = '/admin/anmelden'),
    });
  }
}
