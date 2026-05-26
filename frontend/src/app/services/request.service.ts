import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PublicRequest {
  id: string;
  title: string;
  sport: string;
  description: string;
  knowledgeLevel: string | null;
  gender: string | null;
  age: number | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
}

export interface ManagedRequest extends PublicRequest {
  contactEmail: string;
  editToken: string;
  deleteToken: string;
}

export interface CreateRequestDto {
  title: string;
  sport: string;
  description: string;
  contactEmail: string;
  knowledgeLevel?: string | null;
  gender?: string | null;
  age?: number | null;
}

export interface CreateReplyDto {
  name: string;
  email: string;
  message: string;
  securityAnswer: number;
  securityLeft: number;
  securityRight: number;
}

@Injectable({
  providedIn: 'root',
})
export class RequestService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  getAll(sport?: string, skip: number = 0, take: number = 20): Observable<PublicRequest[]> {
    let params = new HttpParams().set('skip', skip.toString()).set('take', take.toString());

    if (sport) {
      params = params.set('sport', sport);
    }

    return this.http.get<PublicRequest[]>(`${this.apiUrl}/requests`, { params });
  }

  getById(id: string): Observable<PublicRequest> {
    return this.http.get<PublicRequest>(`${this.apiUrl}/requests/${id}`);
  }

  getByToken(token: string): Observable<ManagedRequest> {
    return this.http.get<ManagedRequest>(`${this.apiUrl}/requests/manage/${token}`);
  }

  create(request: CreateRequestDto): Observable<PublicRequest> {
    return this.http.post<PublicRequest>(`${this.apiUrl}/requests`, request);
  }

  reply(requestId: string, reply: CreateReplyDto): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/requests/${requestId}/replies`, reply);
  }

  update(token: string, updates: Partial<CreateRequestDto>): Observable<ManagedRequest> {
    return this.http.put<ManagedRequest>(`${this.apiUrl}/requests/manage/${token}`, updates);
  }

  delete(token: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/requests/manage/${token}`);
  }

  getSports(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/sports`);
  }
}
