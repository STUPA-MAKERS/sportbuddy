import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SymbolComponent } from '../shared/symbol.component';
import { ThemeService } from '../shared/theme.service';

/** The header of the signed-out admin pages (login, 403). */
@Component({
  selector: 'app-admin-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SymbolComponent],
  template: `
    <header class="hdr hdr--narrow">
      <a class="brand" routerLink="/">
        <img src="/stupa-mark.svg" alt="" />
        <span><span class="brand-name">Sportbuddy</span><span class="brand-sub">Verwaltung</span></span>
      </a>
      <span class="hdr-sp"></span>
      <a class="lnk" routerLink="/">Zur öffentlichen Seite</a>
      <button class="icbtn" type="button" (click)="theme.toggle()" [attr.aria-label]="theme.theme() === 'dark' ? 'Helles Thema' : 'Dunkles Thema'">
        <app-symbol [name]="theme.theme() === 'dark' ? 'light_mode' : 'dark_mode'" [size]="19" />
      </button>
    </header>
  `,
})
export class AdminHeaderComponent {
  protected readonly theme = inject(ThemeService);
}
