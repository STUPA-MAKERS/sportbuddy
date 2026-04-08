import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { PublicRequest, RequestService } from '../../services/request.service';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    RouterLink,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    MessageModule,
  ],
  templateUrl: './request-detail.component.html',
  styleUrl: './request-detail.component.scss',
})
export class RequestDetailComponent implements OnInit {
  private requestService = inject(RequestService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  request: PublicRequest | null = null;
  loading = false;
  error: string | null = null;
  requestId = '';
  replyForm!: FormGroup;
  replyLoading = false;
  replyError: string | null = null;
  replySuccess: string | null = null;

  ngOnInit() {
    this.requestId = this.route.snapshot.paramMap.get('id') || '';
    this.replyForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
    });
    this.loadRequest();
  }

  loadRequest() {
    this.loading = true;
    this.requestService.getById(this.requestId).subscribe({
      next: (request) => {
        this.request = request;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Anfrage nicht gefunden.';
        this.loading = false;
        console.error('Fehler:', err);
      },
    });
  }

  onReplySubmit() {
    if (this.replyForm.invalid || !this.request) {
      this.replyForm.markAllAsTouched();
      return;
    }

    this.replyLoading = true;
    this.replyError = null;
    this.replySuccess = null;

    this.requestService.reply(this.request.id, this.replyForm.getRawValue()).subscribe({
      next: () => {
        this.replyLoading = false;
        this.replySuccess = 'Ihre Nachricht wurde per E-Mail an den Ersteller gesendet.';
        this.replyForm.reset();
      },
      error: (err) => {
        this.replyLoading = false;
        this.replyError = 'Die Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut.';
        console.error('Fehler:', err);
      },
    });
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
