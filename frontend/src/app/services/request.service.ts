import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Request {
  id: string;
  title: string;
  sport: string;
  description: string;
  contactEmail: string;
  editToken: string;
  deleteToken: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
}

export interface CreateRequestDto {
  title: string;
  sport: string;
  description: string;
  contactEmail: string;
}

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  getAll(sport?: string, skip: number = 0, take: number = 20): Observable<Request[]> {
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('take', take.toString());
    
    if (sport) {
      params = params.set('sport', sport);
    }
    
    return this.http.get<Request[]>(`${this.apiUrl}/requests`, { params });
  }

  getByToken(token: string): Observable<Request> {
    return this.http.get<Request>(`${this.apiUrl}/requests/${token}`);
  }

  create(request: CreateRequestDto): Observable<Request> {
    return this.http.post<Request>(`${this.apiUrl}/requests`, request);
  }

  update(token: string, updates: Partial<Request>): Observable<Request> {
    return this.http.put<Request>(`${this.apiUrl}/requests/${token}`, updates);
  }

  delete(token: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/requests/${token}`);
  }

  getSports(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/sports`);
  }
}

