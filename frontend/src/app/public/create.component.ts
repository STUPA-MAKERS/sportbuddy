import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ButtonComponent,
  IconComponent,
  InputComponent,
  SegmentedComponent,
  StepperComponent,
  ToastService,
  type SegmentedOption,
  type Step,
} from '@stupa-makers/ui-kit';
import { AltchaComponent } from '../shared/altcha.component';
import { ApiService, GENDER_OPTIONS, KNOWLEDGE_LEVELS, errorMessage } from '../shared/api.service';
import { isPhone } from '../shared/media';
import { SymbolComponent } from '../shared/symbol.component';

const DRAFT_KEY = 'sportbuddy.draft';
/** Segment value for "no preference" (stored as null). */
const ANY = '';

/** "Anfrage erstellen": three steps (Sportart, Details, Kontakt & Prüfen), then the done card. */
@Component({
  selector: 'app-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, IconComponent, InputComponent, SegmentedComponent, StepperComponent, SymbolComponent, AltchaComponent],
  templateUrl: './create.component.html',
})
export class CreateComponent {
  protected readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  protected readonly phone = isPhone();

  protected readonly step = signal(0);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly done = signal<{ id: string; title: string; email: string } | null>(null);
  protected readonly resendState = signal<'idle' | 'sending' | 'sent'>('idle');
  protected readonly tried = signal([false, false, false]);

  protected readonly form = this.fb.nonNullable.group({
    sport: ['', Validators.required],
    title: ['', [Validators.required, Validators.maxLength(160)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
    knowledgeLevel: [ANY],
    gender: [ANY],
    age: ['', [Validators.min(1), Validators.max(120), Validators.pattern(/^\d*$/)]],
    contactEmail: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    altchaPayload: ['', Validators.required],
  });
  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  protected readonly levelOptions: SegmentedOption[] = [
    { value: ANY, label: 'Egal' },
    ...KNOWLEDGE_LEVELS.map((l) => ({ value: l, label: l })),
  ];
  protected readonly genderOptions: SegmentedOption[] = [
    { value: ANY, label: 'Keine Angabe' },
    ...GENDER_OPTIONS.map((g) => ({ value: g, label: g })),
  ];

  protected readonly steps = computed<Step[]>(() => {
    const v = this.value();
    const step = this.step();
    const details = [v.knowledgeLevel || null, v.gender || null, v.age || null].filter(Boolean).join(' · ');
    return [
      { label: 'Sportart', hint: step > 0 && v.sport ? v.sport : 'Wähle eine Sportart' },
      { label: 'Details', hint: step > 1 ? details || 'Alle Niveaus' : 'Titel, Beschreibung, Niveau' },
      { label: 'Kontakt & Prüfen', hint: 'E-Mail und Bestätigung' },
    ];
  });

  protected readonly titleLength = computed(() => (this.value().title ?? '').length);
  protected readonly preview = computed(() => {
    const v = this.value();
    return {
      title: v.title?.trim() || 'Ohne Titel',
      sub: [v.sport, v.knowledgeLevel || 'Alle Niveaus'].join(' · '),
      description: v.description ?? '',
      badges: [v.knowledgeLevel, v.gender, v.age ? `${v.age} Jahre` : null].filter(Boolean) as string[],
    };
  });

  constructor() {
    this.api.loadSports().subscribe();
    this.api.loadConfig().subscribe();
    this.restoreDraft();
    effect(() => {
      const v = this.value();
      if (this.done()) return;
      try {
        const { altchaPayload: _, ...draft } = v;
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, step: this.step() }));
      } catch {
        /* private mode */
      }
    });
  }

  protected iconFor(sport: string) {
    return this.api.iconFor(sport);
  }

  protected pickSport(name: string) {
    this.form.controls.sport.setValue(name);
  }

  protected show(name: 'title' | 'description' | 'age' | 'contactEmail'): string {
    const c = this.form.controls[name];
    if (!(c.invalid && (c.touched || this.tried()[this.step()]))) return '';
    if (c.hasError('required')) return name === 'contactEmail' ? 'Bitte gib deine E-Mail-Adresse ein.' : 'Pflichtfeld';
    if (c.hasError('email')) return 'Bitte eine gültige E-Mail-Adresse eingeben.';
    if (c.hasError('minlength')) return 'Mindestens 10 Zeichen.';
    if (c.hasError('maxlength')) return 'Zu lang.';
    return 'Bitte ein Alter zwischen 1 und 120 eingeben.';
  }

  private stepValid(index: number): boolean {
    const c = this.form.controls;
    if (index === 0) return c.sport.valid;
    if (index === 1) return c.title.valid && c.description.valid && c.age.valid;
    return c.contactEmail.valid && c.altchaPayload.valid;
  }

  protected next() {
    const index = this.step();
    this.tried.update((t) => t.map((v, i) => (i === index ? true : v)));
    if (!this.stepValid(index)) return;
    this.step.set(index + 1);
    window.scrollTo({ top: 0 });
  }

  protected back() {
    this.step.update((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0 });
  }

  protected goTo(index: number) {
    if (index < this.step()) this.step.set(index);
  }

  protected submit() {
    this.tried.update((t) => t.map((v, i) => (i === 2 ? true : v)));
    if (!this.stepValid(2)) {
      if (this.form.controls.altchaPayload.invalid && this.form.controls.contactEmail.valid) {
        this.error.set('Bitte bestätige, dass du kein Roboter bist.');
      }
      return;
    }
    const v = this.form.getRawValue();
    this.submitting.set(true);
    this.error.set(null);
    this.api
      .create({
        title: v.title.trim(),
        sport: v.sport,
        description: v.description.trim(),
        knowledgeLevel: v.knowledgeLevel || null,
        gender: v.gender || null,
        age: v.age ? Number(v.age) : null,
        contactEmail: v.contactEmail.trim(),
        altchaPayload: v.altchaPayload,
      })
      .subscribe({
        next: (created) => {
          this.submitting.set(false);
          this.done.set({ id: created.id, title: created.title, email: created.contactEmail });
          try {
            localStorage.removeItem(DRAFT_KEY);
          } catch {
            /* private mode */
          }
          window.scrollTo({ top: 0 });
        },
        error: (e) => {
          this.submitting.set(false);
          this.form.controls.altchaPayload.reset('');
          this.error.set(errorMessage(e, 'Die Anfrage konnte nicht gesendet werden. Bitte versuch es noch einmal.'));
        },
      });
  }

  protected resend() {
    const done = this.done();
    if (!done) return;
    this.resendState.set('sending');
    this.api.resendVerification(done.id).subscribe({
      next: () => {
        this.resendState.set('sent');
        this.toast.success('E-Mail erneut gesendet');
      },
      error: (e) => {
        this.resendState.set('idle');
        this.toast.error(errorMessage(e, 'Die E-Mail konnte nicht gesendet werden.'));
      },
    });
  }

  private restoreDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const { step, ...draft } = JSON.parse(raw);
      this.form.patchValue(draft);
      if (typeof step === 'number' && step > 0 && step < 3) this.step.set(step);
    } catch {
      /* ignore a broken draft */
    }
  }
}
