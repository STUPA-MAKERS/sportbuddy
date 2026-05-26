import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ManagedRequest, RequestService } from '../../services/request.service';

@Component({
  selector: 'app-delete-request',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, RouterLink],
  templateUrl: './delete-request.component.html',
  styleUrl: './delete-request.component.scss'
})
export class DeleteRequestComponent implements OnInit {
  private requestService = inject(RequestService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  request: ManagedRequest | null = null;
  loading = false;
  deleting = false;
  error: string | null = null;
  token: string = '';

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    this.loadRequest();
  }

  loadRequest() {
    this.loading = true;
    this.requestService.getByToken(this.token).subscribe({
      next: (request) => {
        if (!request || request.deleteToken !== this.token) {
          this.error = 'Anfrage nicht gefunden oder kein Löschrecht.';
          this.loading = false;
          return;
        }
        
        this.request = request;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Fehler beim Laden der Anfrage.';
        this.loading = false;
        console.error('Fehler:', err);
      }
    });
  }

  onDelete() {
    if (!confirm('Möchten Sie diese Anfrage wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }

    this.deleting = true;
    this.error = null;

    this.requestService.delete(this.token).subscribe({
      next: (result) => {
        if (result.success) {
          this.router.navigate(['/']);
        } else {
          this.error = 'Fehler beim Löschen der Anfrage.';
          this.deleting = false;
        }
      },
      error: (err) => {
        this.error = 'Fehler beim Löschen der Anfrage.';
        this.deleting = false;
        console.error('Fehler:', err);
      }
    });
  }
}

