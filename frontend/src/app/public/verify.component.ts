import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '@stupa-makers/ui-kit';
import { ApiService, VerifyResult } from '../shared/api.service';
import { longDate } from '../shared/format';
import { SymbolComponent } from '../shared/symbol.component';

/** Opens the confirmation link from the email: online, waiting for review, or a broken link. */
@Component({
  selector: 'app-verify',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent, SymbolComponent],
  template: `
    <div class="center-main">
      @switch (state()) {
        @case ('loading') {
          <article class="done" aria-busy="true">
            <span class="done-ic"><app-symbol name="hourglass_empty" [size]="30" /></span>
            <h1>Wir bestätigen deine Anfrage …</h1>
          </article>
        }
        @case ('ok') {
          <article class="done" aria-labelledby="ok">
            <span class="done-ic"><app-icon name="check" [size]="30" /></span>
            @if (result()!.pendingReview) {
              <span class="st st--warn">Wird geprüft</span>
              <h1 id="ok">Danke, deine E-Mail-Adresse ist bestätigt</h1>
              <p class="lead">„{{ result()!.title }}“ erscheint, sobald das STUPA-Team sie freigegeben hat. Antworten bekommst du per E-Mail.</p>
            } @else {
              <span class="st st--acc">Online</span>
              <h1 id="ok">Deine Anfrage ist online</h1>
              <p class="lead">„{{ result()!.title }}“ ist jetzt für alle sichtbar. Antworten bekommst du per E-Mail.</p>
            }
            @if (result()!.expiresAt) {
              <div class="rowgroup" style="width: 100%">
                <div class="fld-row">
                  <app-symbol class="fld-ic" name="calendar_today" />
                  <span class="fld-text"><span class="fld-label">Online bis</span><span class="fld-value num">{{ until() }}</span></span>
                </div>
              </div>
            }
            <div class="actions">
              @if (!result()!.pendingReview) {
                <a class="btnlink btnlink--fill" [routerLink]="['/anfrage', result()!.requestId]">Anfrage ansehen<app-icon name="right" [size]="18" /></a>
              }
              <a class="btnlink btnlink--text" routerLink="/">Alle Anfragen</a>
            </div>
          </article>
        }
        @case ('error') {
          <article class="done done--sm" aria-labelledby="er">
            <span class="done-ic done-ic--err"><app-symbol name="warning" [size]="30" /></span>
            <span class="st st--err">Fehler</span>
            <h1 id="er">Dieser Link funktioniert nicht mehr</h1>
            <p class="lead">Vielleicht wurde die Anfrage schon bestätigt, gelöscht oder ist abgelaufen.</p>
            <div class="actions">
              <a class="btnlink btnlink--outlined" routerLink="/">Zur Übersicht</a>
              <a class="btnlink btnlink--text" routerLink="/erstellen">Neue Anfrage</a>
            </div>
          </article>
        }
      }
    </div>
  `,
})
export class VerifyComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly token = input.required<string>();

  protected readonly state = signal<'loading' | 'ok' | 'error'>('loading');
  protected readonly result = signal<VerifyResult | null>(null);
  protected until = () => (this.result()?.expiresAt ? longDate(this.result()!.expiresAt!) : '');

  ngOnInit() {
    this.api.verify(this.token()).subscribe({
      next: (r) => {
        this.result.set(r);
        this.state.set('ok');
      },
      error: () => this.state.set('error'),
    });
  }
}
