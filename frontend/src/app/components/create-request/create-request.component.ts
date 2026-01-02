import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { RequestService } from '../../services/request.service';

@Component({
  selector: 'app-create-request',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    MessageModule,
    SelectModule,
  ],
  templateUrl: './create-request.component.html',
  styleUrl: './create-request.component.scss'
})
export class CreateRequestComponent implements OnInit {
  private requestService = inject(RequestService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  
  form!: FormGroup;
  sports: { label: string; value: string }[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit() {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(160)]],
      sport: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      contactEmail: ['', [Validators.required, Validators.email]],
    });

    this.loadSports();
  }

  loadSports() {
    this.requestService.getSports().subscribe({
      next: (sports) => {
        this.sports = sports.map(sport => ({ label: sport, value: sport }));
      },
      error: (err) => {
        console.error('Fehler beim Laden der Sportarten:', err);
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    this.requestService.create(this.form.value).subscribe({
      next: (request) => {
        this.loading = false;
        this.router.navigate(['/request', request.editToken]);
      },
      error: (err) => {
        this.error = 'Fehler beim Erstellen der Anfrage. Bitte versuchen Sie es erneut.';
        this.loading = false;
        console.error('Fehler:', err);
      }
    });
  }
}

