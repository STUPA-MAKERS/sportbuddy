import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonComponent, CheckboxComponent, DialogComponent, IconComponent, ToastService } from '@stupa-makers/ui-kit';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ApiService, ModerationStatus, errorMessage } from '../shared/api.service';
import { ago, agoTime, dateTime, longDate, plural } from '../shared/format';
import { isPhone } from '../shared/media';
import { SymbolComponent } from '../shared/symbol.component';
import { AdminApiService, AdminDetail, AdminListItem, HIDE_REASONS, StatusFilter } from './admin-api.service';

export const STATUS_LABEL: Record<ModerationStatus, { label: string; cls: string }> = {
  review: { label: 'Zu prüfen', cls: 'st--err' },
  unverified: { label: 'Unbestätigt', cls: 'st--warn' },
  online: { label: 'Online', cls: 'st--acc' },
  hidden: { label: 'Ausgeblendet', cls: 'st--muted' },
};

const HISTORY: Record<string, { icon: string; text: string }> = {
  created: { icon: 'add_circle', text: 'Erstellt' },
  verified: { icon: 'mark_email_read', text: 'E-Mail bestätigt' },
  updated: { icon: 'edit', text: 'Von Ersteller:in bearbeitet' },
  extended: { icon: 'schedule', text: 'Verlängert' },
  reported: { icon: 'flag', text: 'Gemeldet' },
  'auto-hidden': { icon: 'visibility_off', text: 'Automatisch ausgeblendet' },
  hidden: { icon: 'visibility_off', text: 'Ausgeblendet' },
  unhidden: { icon: 'visibility', text: 'Wieder eingeblendet' },
  approved: { icon: 'done_all', text: 'Freigegeben' },
  'reports-dismissed': { icon: 'done_all', text: 'Meldungen verworfen' },
  'verification-resent': { icon: 'forward_to_inbox', text: 'Bestätigungs-E-Mail erneut gesendet' },
};

const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'review', label: 'Zu prüfen' },
  { key: 'unverified', label: 'Unbestätigt' },
  { key: 'online', label: 'Online' },
  { key: 'hidden', label: 'Ausgeblendet' },
  { key: 'all', label: 'Alle' },
];

@Component({
  selector: 'app-moderation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, ButtonComponent, CheckboxComponent, DialogComponent, IconComponent, SymbolComponent],
  templateUrl: './moderation.component.html',
})
export class ModerationComponent implements OnInit {
  private readonly admin = inject(AdminApiService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly phone = isPhone();

  readonly id = input<string | undefined>();
  readonly status = input<StatusFilter | undefined>();

  protected readonly tabs = TABS;
  protected readonly tab = signal<StatusFilter>('review');
  protected readonly q = signal('');
  protected readonly items = signal<AdminListItem[]>([]);
  protected readonly counts = signal<Record<StatusFilter, number> | null>(null);
  protected readonly loaded = signal(false);
  protected readonly selection = signal<ReadonlySet<string>>(new Set());
  protected readonly detail = signal<AdminDetail | null>(null);
  protected readonly busy = signal<string | null>(null);

  // Hide dialog (one request or the selection).
  protected readonly hideReasons = HIDE_REASONS;
  protected readonly hideFor = signal<'detail' | 'selection' | null>(null);
  protected hideReason: string = HIDE_REASONS[0];
  protected hideMessage = '';
  protected hideNotify = true;
  // Delete confirmation.
  protected readonly deleteFor = signal<'detail' | 'selection' | null>(null);

  protected readonly selectedId = computed(() => this.id() ?? (this.phone() ? null : this.items()[0]?.id ?? null));
  protected readonly st = STATUS_LABEL;
  protected readonly ago = ago;
  protected readonly agoTime = agoTime;
  protected readonly plural = plural;

  protected readonly history = computed(() =>
    (this.detail()?.history ?? []).map((h) => {
      const base = HISTORY[h.action] ?? { icon: 'history', text: h.action };
      const parts = [base.text, h.note, h.actor ? `von ${h.actor}` : null].filter(Boolean);
      return { id: h.id, icon: base.icon, text: parts.join(' · '), when: agoTime(h.createdAt) };
    }),
  );

  ngOnInit() {
    // Router inputs are bound after the constructor, so the deep link is read here.
    const s = this.status();
    if (s) this.tab.set(s);
  }

  constructor() {
    this.api.loadSports().subscribe();

    toObservable(computed(() => ({ tab: this.tab(), q: this.q() })))
      .pipe(
        debounceTime(150),
        distinctUntilChanged((a, b) => a.tab === b.tab && a.q.trim() === b.q.trim()),
        switchMap(({ tab, q }) => this.admin.list(tab, q)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (list) => {
          this.items.set(list.items);
          this.counts.set(list.counts);
          this.loaded.set(true);
          const ids = new Set(list.items.map((i) => i.id));
          this.selection.update((sel) => new Set([...sel].filter((id) => ids.has(id))));
        },
        error: (e) => this.handleError(e),
      });

    effect(() => {
      const id = this.selectedId();
      untracked(() => this.loadDetail(id));
    });
  }

  protected iconFor(sport: string) {
    return this.api.iconFor(sport);
  }

  protected pickTab(key: StatusFilter) {
    this.tab.set(key);
    this.selection.set(new Set());
    if (this.id()) this.router.navigate(['/admin/moderation']);
  }

  protected toggle(id: string, event?: Event) {
    event?.stopPropagation();
    event?.preventDefault();
    this.selection.update((sel) => {
      const next = new Set(sel);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  protected clearSelection() {
    this.selection.set(new Set());
  }

  protected reportTitle(d: AdminDetail) {
    return plural(d.openReports, 'offene Meldung', 'offene Meldungen');
  }

  protected openReports(d: AdminDetail) {
    return d.reports.filter((r) => !r.dismissed);
  }

  protected person(d: AdminDetail) {
    return [d.gender, d.age ? `${d.age} Jahre` : null].filter(Boolean).join(' · ');
  }

  protected created(d: AdminDetail) {
    return dateTime(d.createdAt);
  }

  protected expires(d: AdminDetail) {
    if (d.status === 'unverified') return 'erst nach Bestätigung';
    return d.expiresAt ? longDate(d.expiresAt) : '–';
  }

  // --- actions -----------------------------------------------------------------------

  protected openHide(target: 'detail' | 'selection') {
    this.hideReason = HIDE_REASONS[0];
    this.hideMessage = '';
    this.hideNotify = target === 'detail';
    this.hideFor.set(target);
  }

  protected confirmHide() {
    const target = this.hideFor();
    if (target === 'selection') {
      this.run('hide', this.admin.bulk([...this.selection()], 'hide', this.hideReason), () => {
        this.toast.success(`${plural(this.selection().size, 'Anfrage', 'Anfragen')} ausgeblendet`);
        this.selection.set(new Set());
      });
    } else if (target === 'detail' && this.detail()) {
      const body = { reason: this.hideReason, message: this.hideMessage.trim() || undefined, notify: this.hideNotify };
      this.run('hide', this.admin.hide(this.detail()!.id, body), () => this.toast.success('Ausgeblendet'));
    }
    this.hideFor.set(null);
  }

  protected confirmDelete() {
    const target = this.deleteFor();
    if (target === 'selection') {
      const n = this.selection().size;
      this.run('delete', this.admin.bulk([...this.selection()], 'delete'), () => {
        this.toast.success(`${plural(n, 'Anfrage', 'Anfragen')} gelöscht`);
        this.selection.set(new Set());
        this.router.navigate(['/admin/moderation']);
      });
    } else if (target === 'detail' && this.detail()) {
      this.run('delete', this.admin.remove(this.detail()!.id), () => {
        this.toast.success('Gelöscht');
        this.router.navigate(['/admin/moderation']);
      });
    }
    this.deleteFor.set(null);
  }

  protected unhide() {
    this.run('unhide', this.admin.unhide(this.detail()!.id), () => this.toast.success('Wieder eingeblendet'));
  }

  protected approve() {
    const d = this.detail()!;
    this.run('approve', this.admin.approve(d.id), () =>
      this.toast.success(d.openReports > 0 ? 'Meldungen verworfen' : 'Freigegeben'),
    );
  }

  protected resend() {
    this.run('resend', this.admin.resend(this.detail()!.id), () => this.toast.success('Bestätigungs-E-Mail gesendet'));
  }

  private run<T>(key: string, call: import('rxjs').Observable<T>, done: () => void) {
    this.busy.set(key);
    call.subscribe({
      next: (result) => {
        this.busy.set(null);
        if (result && typeof result === 'object' && 'reports' in (result as object)) this.detail.set(result as unknown as AdminDetail);
        done();
        this.refresh();
      },
      error: (e) => {
        this.busy.set(null);
        this.handleError(e);
      },
    });
  }

  private refresh() {
    this.admin.list(this.tab(), this.q()).subscribe((list) => {
      this.items.set(list.items);
      this.counts.set(list.counts);
    });
  }

  private loadDetail(id: string | null) {
    if (!id) {
      this.detail.set(null);
      return;
    }
    if (this.detail()?.id === id) return;
    this.admin.detail(id).subscribe({
      next: (d) => this.detail.set(d),
      error: (e) => {
        this.detail.set(null);
        this.handleError(e);
      },
    });
  }

  private handleError(e: unknown) {
    if ((e as { status?: number }).status === 401) {
      this.router.navigate(['/admin/anmelden'], { queryParams: { returnTo: this.router.url } });
      return;
    }
    this.toast.error(errorMessage(e, 'Das hat nicht geklappt.'));
  }
}
