import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { IconComponent } from '@stupa-makers/ui-kit';
import { filter, map, startWith } from 'rxjs';
import { SymbolComponent } from '../shared/symbol.component';
import { ThemeService } from '../shared/theme.service';

export const HOCHSCHULSPORT_URL =
  'https://tsg-reutlingen.de/kooperationen/hochschule-reutlingen/anmeldung-hochschulsportkurse';

/** Public frame: header with brand and actions, footer, and the bottom navigation on phones. */
@Component({
  selector: 'app-public-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, IconComponent, SymbolComponent],
  styles: [':host{display:flex;flex-direction:column;min-height:100dvh}main{flex:1 1 auto;display:flex;flex-direction:column}'],
  template: `
    <header class="hdr" [class.hdr--narrow]="flow()">
      <a class="brand" routerLink="/">
        <img src="/stupa-mark.svg" alt="" />
        <span><span class="brand-name">Sportbuddy</span><span class="brand-sub">STUPA · Hochschule Reutlingen</span></span>
      </a>
      <span class="hdr-sp"></span>
      <a class="lnk hide-phone" [href]="hochschulsport" target="_blank" rel="noopener">
        Hochschulsport <app-icon name="ext" [size]="15" />
      </a>
      <a class="lnk hide-phone" href="https://pretix.eu/STUPA/" target="_blank" rel="noopener">
        Ticket-Shop <app-icon name="ext" [size]="15" />
      </a>
      <button
        class="icbtn"
        type="button"
        (click)="theme.toggle()"
        [attr.aria-label]="theme.theme() === 'dark' ? 'Helles Thema' : 'Dunkles Thema'"
        [title]="theme.theme() === 'dark' ? 'Helles Thema' : 'Dunkles Thema'"
      >
        <app-symbol [name]="theme.theme() === 'dark' ? 'light_mode' : 'dark_mode'" [size]="19" />
      </button>
      @if (flow()) {
        <a class="btnlink btnlink--outlined hide-phone" routerLink="/">
          <app-icon name="left" [size]="17" />Alle Anfragen
        </a>
      } @else {
        <a class="btnlink btnlink--fill hide-phone" routerLink="/erstellen">
          <app-symbol name="add" [size]="19" />Anfrage erstellen
        </a>
      }
    </header>

    <main><router-outlet /></main>

    <footer class="ftr">
      <span>© STUPA Hochschule Reutlingen</span>
      <a href="https://stupa.reutlingen.university/" target="_blank" rel="noopener">STUPA</a>
      <a href="https://www.reutlingen-university.de/" target="_blank" rel="noopener">Hochschule Reutlingen</a>
      <a href="https://stupa.reutlingen.university/kontakt/" target="_blank" rel="noopener">Kontakt</a>
      <a href="https://www.instagram.com/stupa.hsrt/" target="_blank" rel="noopener">Instagram</a>
    </footer>

    <nav class="bnav" aria-label="Hauptnavigation">
      <a routerLink="/" [class.on]="!flow()" [attr.aria-current]="!flow() ? 'page' : null">
        <span class="bnav-ind"><app-icon name="search" [size]="20" /></span>Entdecken
      </a>
      <a routerLink="/erstellen" [class.on]="url().startsWith('/erstellen')" [attr.aria-current]="url().startsWith('/erstellen') ? 'page' : null">
        <span class="bnav-ind"><app-symbol name="add" [size]="20" /></span>Erstellen
      </a>
      <a [href]="hochschulsport" target="_blank" rel="noopener">
        <span class="bnav-ind"><app-icon name="ext" [size]="20" /></span>Hochschulsport
      </a>
    </nav>
  `,
})
export class PublicShellComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly hochschulsport = HOCHSCHULSPORT_URL;
  private readonly router = inject(Router);

  protected readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: '/' },
  );

  /** Wizard and follow-up pages show "Alle Anfragen" instead of "Anfrage erstellen". */
  protected readonly flow = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(() => {
        let r = this.router.routerState.snapshot.root;
        while (r.firstChild) r = r.firstChild;
        return !!r.data?.['flow'];
      }),
    ),
    { initialValue: false },
  );
}
