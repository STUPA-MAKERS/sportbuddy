import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonComponent, DialogComponent, IconComponent, InputComponent, ToastService } from '@stupa-makers/ui-kit';
import { AltchaComponent } from '../shared/altcha.component';
import { ApiService, PublicRequest, REPORT_REASONS, errorMessage } from '../shared/api.service';
import { daysLeft, shortDate } from '../shared/format';
import { isPhone } from '../shared/media';
import { SymbolComponent } from '../shared/symbol.component';

/** The detail sheet of a request: facts, the reply form and "Melden". */
@Component({
  selector: 'app-request-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, ReactiveFormsModule, RouterLink, ButtonComponent, DialogComponent, IconComponent, InputComponent, SymbolComponent, AltchaComponent],
  templateUrl: './request-detail.component.html',
})
export class RequestDetailComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  protected readonly phone = isPhone();

  readonly request = input.required<PublicRequest>();
  readonly icon = input('sports');
  readonly closed = output<void>();

  protected readonly facts = computed(() => {
    const r = this.request();
    return [
      { label: 'Kenntnisstand', value: r.knowledgeLevel },
      { label: 'Geschlecht', value: r.gender },
      { label: 'Alter', value: r.age ? `${r.age} Jahre` : null },
    ].filter((f): f is { label: string; value: string } => !!f.value);
  });
  protected readonly created = computed(() => shortDate(this.request().createdAt));
  protected readonly left = computed(() => daysLeft(this.request().expiresAt));

  protected readonly replyForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
    altchaPayload: ['', Validators.required],
  });
  protected readonly sending = signal(false);
  protected readonly replyError = signal<string | null>(null);
  protected readonly sent = signal<{ email: string; message: string } | null>(null);
  protected readonly replyOpen = signal(false);
  protected readonly submitted = signal(false);

  protected readonly reasons = REPORT_REASONS;
  protected readonly reportOpen = signal(false);
  protected readonly reportForm = this.fb.nonNullable.group({
    reason: ['', Validators.required],
    comment: ['', Validators.maxLength(1000)],
    altchaPayload: ['', Validators.required],
  });
  protected readonly reporting = signal(false);
  protected readonly reportError = signal<string | null>(null);

  constructor() {
    // A different request starts with a fresh form.
    effect(() => {
      this.request();
      this.sent.set(null);
      this.replyError.set(null);
      this.submitted.set(false);
      this.replyForm.controls.message.reset('');
      this.replyForm.controls.altchaPayload.reset('');
    });
  }

  protected err(name: 'name' | 'email' | 'message'): string {
    const c = this.replyForm.controls[name];
    if (!(c.invalid && (c.touched || this.submitted()))) return '';
    if (c.hasError('required')) return name === 'message' ? 'Bitte schreib eine Nachricht.' : 'Pflichtfeld';
    if (c.hasError('email')) return 'Bitte eine gültige E-Mail-Adresse eingeben.';
    if (c.hasError('minlength')) return 'Mindestens 10 Zeichen.';
    return 'Zu lang.';
  }

  protected copyLink() {
    const url = `${location.origin}/anfrage/${this.request().id}`;
    const done = () => this.toast.success('Link kopiert');
    if (navigator.share && this.phone()) {
      navigator.share({ title: this.request().title, url }).catch(() => undefined);
      return;
    }
    navigator.clipboard?.writeText(url).then(done, () => this.toast.show(url));
  }

  protected send() {
    this.submitted.set(true);
    this.replyForm.markAllAsTouched();
    if (this.replyForm.invalid) {
      if (this.replyForm.controls.altchaPayload.invalid) this.replyError.set('Bitte bestätige, dass du kein Roboter bist.');
      return;
    }
    this.sending.set(true);
    this.replyError.set(null);
    const value = this.replyForm.getRawValue();
    this.api.reply(this.request().id, value).subscribe({
      next: () => {
        this.sending.set(false);
        this.replyOpen.set(false);
        this.sent.set({ email: value.email, message: value.message });
        this.replyForm.controls.message.reset('');
        this.replyForm.controls.altchaPayload.reset('');
        this.submitted.set(false);
      },
      error: (e) => {
        this.sending.set(false);
        this.replyForm.controls.altchaPayload.reset('');
        this.replyError.set(errorMessage(e, 'Die Nachricht konnte nicht gesendet werden.'));
      },
    });
  }

  protected openReport() {
    this.reportForm.reset({ reason: '', comment: '', altchaPayload: '' });
    this.reportError.set(null);
    this.reportOpen.set(true);
  }

  protected submitReport() {
    if (this.reportForm.invalid) {
      this.reportError.set(
        this.reportForm.controls.reason.invalid ? 'Bitte wähle einen Grund.' : 'Bitte bestätige, dass du kein Roboter bist.',
      );
      return;
    }
    this.reporting.set(true);
    const { reason, comment, altchaPayload } = this.reportForm.getRawValue();
    this.api.report(this.request().id, { reason, comment: comment.trim() || undefined, altchaPayload }).subscribe({
      next: () => {
        this.reporting.set(false);
        this.reportOpen.set(false);
        this.toast.success('Danke. Das STUPA-Team schaut sich die Anfrage an.');
      },
      error: (e) => {
        this.reporting.set(false);
        this.reportForm.controls.altchaPayload.reset('');
        this.reportError.set(errorMessage(e, 'Die Meldung konnte nicht gesendet werden.'));
      },
    });
  }
}
