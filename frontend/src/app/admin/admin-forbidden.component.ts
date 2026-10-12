import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ButtonComponent, IconComponent } from '@stupa-makers/ui-kit';
import { catchError, of } from 'rxjs';
import { SymbolComponent } from '../shared/symbol.component';
import { AdminApiService } from './admin-api.service';
import { AdminHeaderComponent } from './admin-header.component';

@Component({
  selector: 'app-admin-forbidden',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminHeaderComponent, RouterLink, ButtonComponent, IconComponent, SymbolComponent],
  styles: [':host{display:flex;flex-direction:column;min-height:100dvh}'],
  template: `
    <app-admin-header />
    <main class="center-main">
      <article class="done" aria-labelledby="fb">
        <span class="done-ic done-ic--err"><app-symbol name="block" [size]="30" /></span>
        <span class="st st--err">403 · Kein Zugriff</span>
        <h1 id="fb">Dir fehlt die Moderationsrolle</h1>
        <p class="lead">
          @if (who()?.email || who()?.name) {
            Du bist als <strong>{{ who()!.email || who()!.name }}</strong> angemeldet.
          }
          Die Verwaltung braucht die Gruppe <span class="code-chip">{{ config()?.adminGroup ?? '…' }}</span> im Identity Provider.
        </p>
        <div class="note" style="width: 100%">
          <app-icon name="info" [size]="18" />
          <span>Die Gruppe vergibt das STUPA-Admin-Team. Frag dort nach, wenn du moderieren sollst.</span>
        </div>
        <div class="actions">
          <app-button variant="outlined" (click)="logout()"><app-symbol name="login" [size]="18" />Mit anderem Konto anmelden</app-button>
          <a class="btnlink btnlink--text" routerLink="/">Zur öffentlichen Seite</a>
        </div>
      </article>
    </main>
  `,
})
export class AdminForbiddenComponent {
  private readonly api = inject(AdminApiService);
  protected readonly config = toSignal(this.api.authConfig().pipe(catchError(() => of(null))));
  protected readonly who = toSignal(this.api.denied().pipe(catchError(() => of(null))));

  protected logout() {
    this.api.logout().subscribe({
      next: ({ logoutUrl }) => (location.href = logoutUrl ?? '/admin/anmelden'),
      error: () => (location.href = '/admin/anmelden'),
    });
  }
}
