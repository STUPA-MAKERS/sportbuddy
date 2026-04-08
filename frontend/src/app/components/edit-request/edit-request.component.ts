import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ManagedRequest, RequestService } from '../../services/request.service';

@Component({
  selector: 'app-edit-request',
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
    SelectModule,
  ],
  templateUrl: './edit-request.component.html',
  styleUrl: './edit-request.component.scss',
})
export class EditRequestComponent implements OnInit {
  private requestService = inject(RequestService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  request: ManagedRequest | null = null;
  sports: { label: string; value: string }[] = [];
  knowledgeLevels = [
    { label: 'Anfänger', value: 'Anfänger' },
    { label: 'Fortgeschritten', value: 'Fortgeschritten' },
    { label: 'Profi', value: 'Profi' },
  ];
  genderOptions = [
    { label: 'Männlich', value: 'Männlich' },
    { label: 'Weiblich', value: 'Weiblich' },
    { label: 'Divers', value: 'Divers' },
  ];
  loading = false;
  error: string | null = null;
  token = '';

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';

    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(160)]],
      sport: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      knowledgeLevel: [null],
      gender: [null],
      age: [null, [Validators.min(1), Validators.max(120)]],
    });

    this.loadRequest();
    this.loadSports();
  }

  loadRequest() {
    this.loading = true;
    this.requestService.getByToken(this.token).subscribe({
      next: (request) => {
        if (!request || request.editToken !== this.token) {
          this.error = 'Anfrage nicht gefunden oder kein Bearbeitungsrecht.';
          this.loading = false;
          return;
        }

        this.request = request;
        this.form.patchValue({
          title: request.title,
          sport: request.sport,
          description: request.description,
          knowledgeLevel: request.knowledgeLevel,
          gender: request.gender,
          age: request.age,
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Fehler beim Laden der Anfrage.';
        this.loading = false;
        console.error('Fehler:', err);
      },
    });
  }

  loadSports() {
    this.requestService.getSports().subscribe({
      next: (sports) => {
        this.sports = sports.map((sport) => ({ label: sport, value: sport }));
      },
      error: (err) => {
        console.error('Fehler beim Laden der Sportarten:', err);
      },
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

    this.requestService.update(this.token, payload).subscribe({
      next: (request) => {
        this.loading = false;
        this.router.navigate(['/request', request.id]);
      },
      error: (err) => {
        this.error = 'Fehler beim Aktualisieren der Anfrage.';
        this.loading = false;
        console.error('Fehler:', err);
      },
    });
  }
}
