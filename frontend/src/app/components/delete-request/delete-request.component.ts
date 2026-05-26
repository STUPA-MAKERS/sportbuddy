import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PublicRequest, RequestService } from '../../services/request.service';

@Component({
  selector: 'app-delete-request',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, RouterLink],
  templateUrl: './delete-request.component.html',
  styleUrl: './delete-request.component.scss',
})
export class DeleteRequestComponent implements OnInit {
  private requestService = inject(RequestService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  request: PublicRequest | null = null;
  loading = false;
  deleting = false;
  error: string | null = null;
  token = '';

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    this.loadRequest();
  }

  loadRequest() {
    this.loading = true;
    this.requestService.getDeleteConfirm(this.token).subscribe({
      next: (request) => {
        this.request = request;
        this.loading = false;
      },
      error: () => {
        this.error = 'Anfrage nicht gefunden oder kein Löschrecht.';
        this.loading = false;
      },
    });
  }

  onDelete() {
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
      error: () => {
        this.error = 'Fehler beim Löschen der Anfrage.';
        this.deleting = false;
      },
    });
  }
}
