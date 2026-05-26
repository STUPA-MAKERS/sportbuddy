import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { PublicRequest, RequestService } from '../../services/request.service';
import { formatDate } from '../../utils/format-date';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    TagModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private requestService = inject(RequestService);
  
  requests: PublicRequest[] = [];
  sports: string[] = [];
  selectedSport: string | null = null;
  loading = false;
  error: string | null = null;

  ngOnInit() {
    this.loadSports();
    this.loadRequests();
  }

  loadSports() {
    this.requestService.getSports().subscribe({
      next: (sports) => {
        this.sports = sports;
      },
      error: (err) => {
        console.error('Fehler beim Laden der Sportarten:', err);
      }
    });
  }

  loadRequests() {
    this.loading = true;
    this.error = null;
    
    this.requestService.getAll(this.selectedSport || undefined).subscribe({
      next: (requests) => {
        this.requests = requests;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Fehler beim Laden der Anfragen. Bitte versuche es später erneut.';
        this.loading = false;
        console.error('Fehler:', err);
      }
    });
  }

  onSportChange() {
    this.loadRequests();
  }

  clearFilter() {
    this.selectedSport = null;
    this.loadRequests();
  }

  formatDate = formatDate;
}

