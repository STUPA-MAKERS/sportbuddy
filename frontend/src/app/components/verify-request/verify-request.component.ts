import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { RequestService } from '../../services/request.service';

@Component({
  selector: 'app-verify-request',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, RouterLink],
  templateUrl: './verify-request.component.html',
})
export class VerifyRequestComponent implements OnInit {
  private requestService = inject(RequestService);
  private route = inject(ActivatedRoute);

  loading = true;
  requestId: string | null = null;
  error: string | null = null;

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token') || '';
    this.requestService.verify(token).subscribe({
      next: (res) => {
        this.loading = false;
        this.requestId = res.requestId;
      },
      error: () => {
        this.loading = false;
        this.error = 'Dieser Verifikationslink ist ungültig oder wurde bereits verwendet.';
      },
    });
  }
}
