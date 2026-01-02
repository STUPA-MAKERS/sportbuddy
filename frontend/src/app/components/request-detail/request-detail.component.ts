import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { RequestService, Request } from '../../services/request.service';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule, RouterLink],
  templateUrl: './request-detail.component.html',
  styleUrl: './request-detail.component.scss'
})
export class RequestDetailComponent implements OnInit {
  private requestService = inject(RequestService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  request: Request | null = null;
  loading = false;
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
        this.request = request;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Anfrage nicht gefunden.';
        this.loading = false;
        console.error('Fehler:', err);
      }
    });
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

