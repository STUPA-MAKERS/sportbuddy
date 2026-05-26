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
  knowledgeLevels = [
    { label: '1 - Anfänger*in', value: 'Anfänger*in' },
    { label: '2 - Fortgeschrittene*r', value: 'Fortgeschrittene*r' },
    { label: '3 - Erfahrene*r', value: 'Erfahrene*r' },
    { label: '4 - Sehr erfahrene*r', value: 'Sehr erfahrene*r' },
    { label: '5 - Expert*in', value: 'Expert*in' },
  ];
  genderOptions = [
    { label: 'Männlich', value: 'Männlich' },
    { label: 'Weiblich', value: 'Weiblich' },
    { label: 'Divers', value: 'Divers' },
  ];
  loading = false;
  error: string | null = null;

  ngOnInit() {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(160)]],
      sport: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      contactEmail: ['', [Validators.required, Validators.email]],
      knowledgeLevel: [null],
      gender: [null],
      age: [null, [Validators.min(1), Validators.max(120)]],
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

    const payload = {
      ...this.form.value,
      age: this.form.value.age ? Number(this.form.value.age) : null,
    };

    this.requestService.create(payload).subscribe({
      next: (request) => {
        this.loading = false;
        this.router.navigate(['/request', request.id]);
      },
      error: (err) => {
        this.error = 'Fehler beim Erstellen der Anfrage. Bitte versuchen Sie es erneut.';
        this.loading = false;
        console.error('Fehler:', err);
      }
    });
  }
}

