import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent, DialogComponent, IconComponent, InputComponent, SwitchComponent, ToastService } from '@stupa-makers/ui-kit';
import { Observable } from 'rxjs';
import { errorMessage } from '../shared/api.service';
import { shortDate } from '../shared/format';
import { SymbolComponent } from '../shared/symbol.component';
import { SPORT_ICONS } from '../shared/symbols.generated';
import { AdminApiService, AdminSettings, AdminSport, BlockedEmail, Moderator } from './admin-api.service';

interface SportDraft {
  id: number | null;
  name: string;
  icon: string;
  active: boolean;
  requests: number;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonComponent, DialogComponent, IconComponent, InputComponent, SwitchComponent, SymbolComponent],
  templateUrl: './settings.component.html',
  styles: [
    `.icons{display:grid;grid-template-columns:repeat(auto-fill,minmax(44px,1fr));gap:6px}
     .icons button{display:grid;place-items:center;height:44px;border:0;border-radius:12px;background:var(--color-surface-2);color:var(--color-text-muted);cursor:pointer}
     .icons button:hover{background:var(--color-surface-3)}
     .icons button.on{background:var(--color-accent);color:var(--color-on-accent)}
     .drag{cursor:grab;color:var(--color-text-subtle);display:grid;place-items:center}
     .dragging{opacity:.5}
     .drop{box-shadow:inset 0 2px 0 var(--color-accent-text)}
     .inactive .fld-value{color:var(--color-text-subtle)}
     .cols{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start}
     .num-input{width:100%}`,
  ],
})
export class SettingsComponent {
  private readonly admin = inject(AdminApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly settings = signal<AdminSettings | null>(null);
  protected readonly sports = signal<AdminSport[]>([]);
  protected readonly blocked = signal<BlockedEmail[]>([]);
  protected readonly icons = SPORT_ICONS;
  protected readonly shortDate = shortDate;

  protected runtimeDays = 90;
  protected autoHideThreshold = 3;

  protected readonly sportDraft = signal<SportDraft | null>(null);
  protected readonly blockOpen = signal(false);
  protected blockPattern = '';
  protected blockReason = '';
  protected readonly blockError = signal('');
  protected readonly dragId = signal<number | null>(null);
  protected readonly overId = signal<number | null>(null);

  constructor() {
    this.admin.settings().subscribe({ next: (s) => this.applySettings(s), error: (e) => this.fail(e) });
    this.admin.sports().subscribe({ next: (s) => this.sports.set(s), error: (e) => this.fail(e) });
    this.admin.blocked().subscribe({ next: (b) => this.blocked.set(b), error: (e) => this.fail(e) });
    this.admin.list('review', '').subscribe({ error: () => undefined });
  }

  // --- settings --------------------------------------------------------------------

  protected saveNumbers() {
    const s = this.settings();
    if (!s) return;
    const runtimeDays = Math.round(Number(this.runtimeDays));
    const autoHideThreshold = Math.round(Number(this.autoHideThreshold));
    if (!(runtimeDays >= 1 && runtimeDays <= 365) || !(autoHideThreshold >= 0 && autoHideThreshold <= 50)) {
      this.toast.error('Laufzeit 1 bis 365 Tage, Schwelle 0 bis 50 Meldungen.');
      this.applySettings(s);
      return;
    }
    if (runtimeDays === s.runtimeDays && autoHideThreshold === s.autoHideThreshold) return;
    this.save({ runtimeDays, autoHideThreshold });
  }

  protected toggle(key: 'reviewBeforePublish' | 'notifyOnReport', value: boolean) {
    this.save({ [key]: value });
  }

  protected setNotify(m: Moderator, notify: boolean) {
    this.admin.setModeratorNotify(m.sub, notify).subscribe({
      next: (s) => {
        this.applySettings(s);
        this.toast.success(notify ? `${m.name} bekommt Moderations-E-Mails` : `${m.name} bekommt keine Moderations-E-Mails mehr`);
      },
      error: (e) => this.fail(e),
    });
  }

  private save(changes: Partial<AdminSettings>) {
    this.admin.saveSettings(changes).subscribe({
      next: (s) => {
        this.applySettings(s);
        this.toast.success('Gespeichert');
      },
      error: (e) => this.fail(e),
    });
  }

  private applySettings(s: AdminSettings) {
    this.settings.set(s);
    this.runtimeDays = s.runtimeDays;
    this.autoHideThreshold = s.autoHideThreshold;
  }

  // --- sports ----------------------------------------------------------------------

  protected newSport() {
    this.sportDraft.set({ id: null, name: '', icon: 'sports', active: true, requests: 0 });
  }

  protected editSport(s: AdminSport) {
    this.sportDraft.set({ id: s.id, name: s.name, icon: s.icon, active: s.active, requests: s.requests });
  }

  protected patchDraft(changes: Partial<SportDraft>) {
    this.sportDraft.update((d) => (d ? { ...d, ...changes } : d));
  }

  protected saveSport() {
    const d = this.sportDraft();
    if (!d || !d.name.trim()) return;
    const call =
      d.id === null
        ? this.admin.createSport({ name: d.name.trim(), icon: d.icon })
        : this.admin.updateSport(d.id, { name: d.name.trim(), icon: d.icon, active: d.active });
    this.updateSports(call, d.id === null ? 'Sportart hinzugefügt' : 'Gespeichert');
  }

  protected deleteSport() {
    const d = this.sportDraft();
    if (d?.id == null) return;
    this.updateSports(this.admin.deleteSport(d.id), 'Sportart gelöscht');
  }

  protected move(index: number, delta: number) {
    const list = [...this.sports()];
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    this.reorder(list);
  }

  protected onDragStart(id: number, event: DragEvent) {
    this.dragId.set(id);
    event.dataTransfer?.setData('text/plain', String(id));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  protected onDragOver(id: number, event: DragEvent) {
    if (this.dragId() === null) return;
    event.preventDefault();
    this.overId.set(id);
  }

  protected onDrop(id: number, event: DragEvent) {
    event.preventDefault();
    const from = this.dragId();
    this.dragId.set(null);
    this.overId.set(null);
    if (from === null || from === id) return;
    const list = [...this.sports()];
    const moving = list.find((s) => s.id === from)!;
    const without = list.filter((s) => s.id !== from);
    without.splice(without.findIndex((s) => s.id === id), 0, moving);
    this.reorder(without);
  }

  protected onDragEnd() {
    this.dragId.set(null);
    this.overId.set(null);
  }

  private reorder(list: AdminSport[]) {
    this.sports.set(list);
    this.admin.reorderSports(list.map((s) => s.id)).subscribe({ next: (s) => this.sports.set(s), error: (e) => this.fail(e) });
  }

  private updateSports(call: Observable<AdminSport[]>, message: string) {
    call.subscribe({
      next: (s) => {
        this.sports.set(s);
        this.sportDraft.set(null);
        this.toast.success(message);
      },
      error: (e) => this.fail(e),
    });
  }

  // --- blocked addresses -----------------------------------------------------------

  protected openBlock() {
    this.blockPattern = '';
    this.blockReason = '';
    this.blockError.set('');
    this.blockOpen.set(true);
  }

  protected block() {
    if (!this.blockPattern.trim()) {
      this.blockError.set('Bitte eine Adresse oder *@domain.de eingeben.');
      return;
    }
    this.admin.block(this.blockPattern.trim(), this.blockReason.trim() || undefined).subscribe({
      next: (b) => {
        this.blocked.set(b);
        this.blockOpen.set(false);
        this.toast.success('Gesperrt');
      },
      error: (e) => this.blockError.set(errorMessage(e, 'Das hat nicht geklappt.')),
    });
  }

  protected unblock(b: BlockedEmail) {
    this.admin.unblock(b.id).subscribe({
      next: (list) => {
        this.blocked.set(list);
        this.toast.success(`Sperre für ${b.pattern} aufgehoben`);
      },
      error: (e) => this.fail(e),
    });
  }

  private fail(e: unknown) {
    if ((e as { status?: number }).status === 401) {
      this.router.navigate(['/admin/anmelden'], { queryParams: { returnTo: '/admin/einstellungen' } });
      return;
    }
    this.toast.error(errorMessage(e, 'Das hat nicht geklappt.'));
  }
}
