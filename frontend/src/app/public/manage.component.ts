import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  ButtonComponent,
  DialogComponent,
  IconComponent,
  SelectComponent,
  ToastService,
  type SelectOption,
} from '@stupa-makers/ui-kit';
import { ApiService, GENDER_OPTIONS, KNOWLEDGE_LEVELS, ManagedRequest, errorMessage } from '../shared/api.service';
import { daysLeft, longDate } from '../shared/format';
import { SymbolComponent } from '../shared/symbol.component';

const STATUS: Record<ManagedRequest['status'], { label: string; cls: string }> = {
  online: { label: 'Online', cls: 'st--acc' },
  review: { label: 'Wird geprüft', cls: 'st--warn' },
  unverified: { label: 'E-Mail noch nicht bestätigt', cls: 'st--warn' },
  hidden: { label: 'Ausgeblendet', cls: 'st--muted' },
};

/** "Deine Anfrage": status, extend, delete and the edit form behind the link from the email. */
@Component({
  selector: 'app-manage',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, DialogComponent, IconComponent, SelectComponent, SymbolComponent],
  templateUrl: './manage.component.html',
})
export class ManageComponent implements OnInit {
  protected readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly token = input.required<string>();

  protected readonly request = signal<ManagedRequest | null>(null);
  protected readonly state = signal<'loading' | 'ok' | 'error' | 'deleted'>('loading');
  protected readonly saving = signal(false);
  protected readonly extending = signal(false);
  protected readonly deleting = signal(false);
  protected readonly confirmDelete = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(160)]],
    sport: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
    knowledgeLevel: [''],
    gender: [''],
    age: ['', [Validators.min(1), Validators.max(120), Validators.pattern(/^\d*$/)]],
  });
  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  protected readonly levelOptions: SelectOption[] = [{ value: '', label: 'Egal' }, ...KNOWLEDGE_LEVELS.map((l) => ({ value: l, label: l }))];
  protected readonly genderOptions: SelectOption[] = [{ value: '', label: 'Keine Angabe' }, ...GENDER_OPTIONS.map((g) => ({ value: g, label: g }))];
  protected readonly sportOptions = computed<SelectOption[]>(() => {
    const names = this.api.sports().map((s) => s.name);
    const current = this.request()?.sport;
    if (current && !names.includes(current)) names.unshift(current);
    return names.map((n) => ({ value: n, label: n }));
  });

  protected readonly status = computed(() => STATUS[this.request()?.status ?? 'online']);
  protected readonly created = computed(() => (this.request() ? longDate(this.request()!.createdAt) : ''));
  protected readonly expires = computed(() => {
    const r = this.request();
    if (!r?.expiresAt) return '';
    const left = daysLeft(r.expiresAt) ?? 0;
    return `${longDate(r.expiresAt)} · noch ${left} ${left === 1 ? 'Tag' : 'Tage'}`;
  });
  protected readonly titleLength = computed(() => (this.value().title ?? '').length);

  /** Number of fields that differ from the saved request. */
  protected readonly changes = computed(() => {
    const r = this.request();
    if (!r) return 0;
    const v = this.value();
    const saved = this.formValue(r);
    return (Object.keys(saved) as (keyof typeof saved)[]).filter((k) => (v[k] ?? '').toString().trim() !== saved[k]).length;
  });

  ngOnInit() {
    this.api.loadSports().subscribe();
    this.api.getManaged(this.token()).subscribe({
      next: (r) => this.load(r),
      error: () => this.state.set('error'),
    });
  }

  protected iconFor(sport: string) {
    return this.api.iconFor(sport);
  }

  protected show(name: 'title' | 'description' | 'age'): string {
    const c = this.form.controls[name];
    if (!c.invalid) return '';
    if (c.hasError('required')) return 'Pflichtfeld';
    if (c.hasError('minlength')) return 'Mindestens 10 Zeichen.';
    if (c.hasError('maxlength')) return 'Zu lang.';
    return 'Bitte ein Alter zwischen 1 und 120 eingeben.';
  }

  protected discard() {
    const r = this.request();
    if (r) this.form.reset(this.formValue(r));
  }

  protected save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.api
      .update(this.token(), {
        title: v.title.trim(),
        sport: v.sport,
        description: v.description.trim(),
        knowledgeLevel: v.knowledgeLevel || null,
        gender: v.gender || null,
        age: v.age ? Number(v.age) : null,
      })
      .subscribe({
        next: (r) => {
          this.saving.set(false);
          this.load(r);
          this.toast.success('Gespeichert');
        },
        error: (e) => {
          this.saving.set(false);
          this.toast.error(errorMessage(e, 'Speichern hat nicht geklappt.'));
        },
      });
  }

  protected extend() {
    this.extending.set(true);
    this.api.extend(this.token()).subscribe({
      next: (r) => {
        this.extending.set(false);
        this.request.set(r);
        this.toast.success(`Verlängert bis ${longDate(r.expiresAt!)}`);
      },
      error: (e) => {
        this.extending.set(false);
        this.toast.error(errorMessage(e, 'Verlängern hat nicht geklappt.'));
      },
    });
  }

  protected remove() {
    this.deleting.set(true);
    this.api.remove(this.token()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.confirmDelete.set(false);
        this.state.set('deleted');
      },
      error: (e) => {
        this.deleting.set(false);
        this.toast.error(errorMessage(e, 'Löschen hat nicht geklappt.'));
      },
    });
  }

  protected openPublic() {
    const r = this.request();
    if (r) this.router.navigate(['/anfrage', r.id]);
  }

  private load(r: ManagedRequest) {
    this.request.set(r);
    this.form.reset(this.formValue(r));
    this.state.set('ok');
  }

  private formValue(r: ManagedRequest) {
    return {
      title: r.title,
      sport: r.sport,
      description: r.description,
      knowledgeLevel: r.knowledgeLevel ?? '',
      gender: r.gender ?? '',
      age: r.age ? String(r.age) : '',
    };
  }
}
