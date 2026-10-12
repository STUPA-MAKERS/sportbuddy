import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

export const KNOWLEDGE_LEVELS = ['Anfänger', 'Fortgeschritten', 'Profi'] as const;
export const GENDER_OPTIONS = ['Männlich', 'Weiblich', 'Divers'] as const;
export const REPORT_REASONS = ['Keine Sportanfrage', 'Werbung oder Spam', 'Unangemessen', 'Sonstiges'] as const;

export interface Sport {
  name: string;
  icon: string;
  count: number;
}

export interface PublicRequest {
  id: string;
  title: string;
  sport: string;
  description: string;
  knowledgeLevel: string | null;
  gender: string | null;
  age: number | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

export type ModerationStatus = 'review' | 'unverified' | 'online' | 'hidden';

export interface ManagedRequest extends PublicRequest {
  contactEmail: string;
  status: ModerationStatus;
  hiddenReason: string | null;
  runtimeDays: number;
}

export interface RequestInput {
  title: string;
  sport: string;
  description: string;
  knowledgeLevel: string | null;
  gender: string | null;
  age: number | null;
}

export interface VerifyResult {
  success: boolean;
  requestId: string;
  title: string;
  sport: string;
  pendingReview: boolean;
  expiresAt: string | null;
}

/** Public API of the backend (`/api`). */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  /** The active sports with their visible requests, loaded once and shared. */
  readonly sports = signal<Sport[]>([]);
  readonly runtimeDays = signal(90);
  private readonly iconByName = computed(() => new Map(this.sports().map((s) => [s.name, s.icon])));

  iconFor(sport: string): string {
    return this.iconByName().get(sport) ?? 'sports';
  }

  loadSports(): Observable<Sport[]> {
    return this.http.get<Sport[]>('/api/sports').pipe(tap((sports) => this.sports.set(sports)));
  }

  loadConfig() {
    return this.http
      .get<{ runtimeDays: number }>('/api/config')
      .pipe(tap((c) => this.runtimeDays.set(c.runtimeDays)));
  }

  list(filter: { sport?: string | null; q?: string; skip?: number; take?: number }) {
    let params = new HttpParams().set('take', String(filter.take ?? 50));
    if (filter.skip) params = params.set('skip', String(filter.skip));
    if (filter.sport) params = params.set('sport', filter.sport);
    if (filter.q?.trim()) params = params.set('q', filter.q.trim());
    return this.http.get<{ items: PublicRequest[]; total: number }>('/api/requests', { params });
  }

  get(id: string) {
    return this.http.get<PublicRequest>(`/api/requests/${id}`);
  }

  create(body: RequestInput & { contactEmail: string; altchaPayload: string }) {
    return this.http.post<PublicRequest & { contactEmail: string }>('/api/requests', body);
  }

  reply(id: string, body: { name: string; email: string; message: string; altchaPayload: string }) {
    return this.http.post<{ success: boolean }>(`/api/requests/${id}/replies`, body);
  }

  report(id: string, body: { reason: string; comment?: string; altchaPayload: string }) {
    return this.http.post<{ success: boolean }>(`/api/requests/${id}/reports`, body);
  }

  resendVerification(id: string) {
    return this.http.post<{ success: boolean }>(`/api/requests/${id}/resend-verification`, {});
  }

  verify(token: string) {
    return this.http.get<VerifyResult>(`/api/requests/verify/${token}`);
  }

  getManaged(token: string) {
    return this.http.get<ManagedRequest>(`/api/requests/manage/${token}`);
  }

  update(token: string, body: Partial<RequestInput>) {
    return this.http.put<ManagedRequest>(`/api/requests/manage/${token}`, body);
  }

  extend(token: string) {
    return this.http.post<ManagedRequest>(`/api/requests/manage/${token}/extend`, {});
  }

  remove(token: string) {
    return this.http.delete<{ success: boolean }>(`/api/requests/manage/${token}`);
  }
}

/** The message of an API error, or a fallback. */
export function errorMessage(err: unknown, fallback: string): string {
  const e = err as { status?: number; error?: { message?: string | string[] } };
  if (e?.status === 0) return 'Keine Verbindung zum Server. Bitte versuch es gleich noch einmal.';
  const msg = e?.error?.message;
  if (Array.isArray(msg)) return msg[0] ?? fallback;
  return typeof msg === 'string' && e.status !== 500 ? msg : fallback;
}
