import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { ModerationStatus, PublicRequest } from '../shared/api.service';

export type StatusFilter = ModerationStatus | 'all';

export interface AdminListItem {
  id: string;
  title: string;
  sport: string;
  knowledgeLevel: string | null;
  createdAt: string;
  expiresAt: string | null;
  pendingReview: boolean;
  status: ModerationStatus;
  openReports: number;
}

export interface AdminList {
  counts: Record<StatusFilter, number>;
  items: AdminListItem[];
}

export interface AdminDetail extends PublicRequest {
  contactEmail: string;
  status: ModerationStatus;
  hiddenReason: string | null;
  hiddenAt: string | null;
  verifiedAt: string | null;
  pendingReview: boolean;
  openReports: number;
  reports: { id: string; reason: string; comment: string | null; dismissed: boolean; createdAt: string }[];
  history: { id: string; action: string; actor: string | null; note: string | null; createdAt: string }[];
}

export interface AdminSettings {
  runtimeDays: number;
  autoHideThreshold: number;
  reviewBeforePublish: boolean;
  notifyOnReport: boolean;
  moderationEmail: string | null;
  adminGroup: string;
  /** Everyone who signed in with the admin group. */
  moderators: Moderator[];
  /** Addresses that get moderation emails. */
  recipients: string[];
  /** Moderators who have not signed in for this many days get no emails. */
  inactiveAfterDays: number;
}

export interface Moderator {
  sub: string;
  name: string;
  email: string | null;
  notify: boolean;
  lastLoginAt: string;
  /** Signed in within `inactiveAfterDays`. */
  active: boolean;
}

export interface AdminSport {
  id: number;
  name: string;
  icon: string;
  position: number;
  active: boolean;
  requests: number;
}

export interface BlockedEmail {
  id: number;
  pattern: string;
  reason: string | null;
  createdAt: string;
}

export interface AdminUser {
  name: string;
  email: string | null;
}

export const HIDE_REASONS = ['Keine Sportanfrage', 'Werbung', 'Unangemessen', 'Doppelt', 'Sonstiges'] as const;

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/admin';

  readonly user = signal<AdminUser | null>(null);
  /** Requests waiting for a moderator, for the badge on the rail. */
  readonly reviewCount = signal(0);

  authConfig() {
    return this.http.get<{ enabled: boolean; adminGroup: string }>(`${this.base}/auth/config`);
  }

  me() {
    return this.http.get<AdminUser>(`${this.base}/auth/me`).pipe(tap((u) => this.user.set(u)));
  }

  denied() {
    return this.http.get<{ name: string | null; email: string | null }>(`${this.base}/auth/denied`);
  }

  logout() {
    return this.http
      .post<{ logoutUrl: string | null }>(`${this.base}/auth/logout`, {})
      .pipe(tap(() => this.user.set(null)));
  }

  loginUrl(returnTo: string) {
    return `${this.base}/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
  }

  list(status: StatusFilter, q: string) {
    let params = new HttpParams().set('status', status);
    if (q.trim()) params = params.set('q', q.trim());
    return this.http
      .get<AdminList>(`${this.base}/requests`, { params })
      .pipe(tap((list) => this.reviewCount.set(list.counts.review)));
  }

  detail(id: string) {
    return this.http.get<AdminDetail>(`${this.base}/requests/${id}`);
  }

  hide(id: string, body: { reason: string; message?: string; notify: boolean }) {
    return this.http.post<AdminDetail>(`${this.base}/requests/${id}/hide`, body);
  }

  unhide(id: string) {
    return this.http.post<AdminDetail>(`${this.base}/requests/${id}/unhide`, {});
  }

  approve(id: string) {
    return this.http.post<AdminDetail>(`${this.base}/requests/${id}/approve`, {});
  }

  resend(id: string) {
    return this.http.post<AdminDetail>(`${this.base}/requests/${id}/resend-verification`, {});
  }

  remove(id: string) {
    return this.http.delete<{ success: boolean }>(`${this.base}/requests/${id}`);
  }

  bulk(ids: string[], action: 'hide' | 'delete', reason?: string) {
    return this.http.post<{ affected: number }>(`${this.base}/requests/bulk`, { ids, action, reason });
  }

  settings() {
    return this.http.get<AdminSettings>(`${this.base}/settings`);
  }

  saveSettings(body: Partial<AdminSettings>) {
    return this.http.put<AdminSettings>(`${this.base}/settings`, body);
  }

  setModeratorNotify(sub: string, notify: boolean) {
    return this.http.put<AdminSettings>(`${this.base}/moderators/${encodeURIComponent(sub)}`, { notify });
  }

  removeModerator(sub: string) {
    return this.http.delete<AdminSettings>(`${this.base}/moderators/${encodeURIComponent(sub)}`);
  }

  sports() {
    return this.http.get<AdminSport[]>(`${this.base}/sports`);
  }

  createSport(body: { name: string; icon: string }) {
    return this.http.post<AdminSport[]>(`${this.base}/sports`, body);
  }

  updateSport(id: number, body: { name?: string; icon?: string; active?: boolean }) {
    return this.http.put<AdminSport[]>(`${this.base}/sports/${id}`, body);
  }

  reorderSports(ids: number[]) {
    return this.http.put<AdminSport[]>(`${this.base}/sports/order`, { ids });
  }

  deleteSport(id: number) {
    return this.http.delete<AdminSport[]>(`${this.base}/sports/${id}`);
  }

  blocked() {
    return this.http.get<BlockedEmail[]>(`${this.base}/blocked-emails`);
  }

  block(pattern: string, reason?: string) {
    return this.http.post<BlockedEmail[]>(`${this.base}/blocked-emails`, { pattern, reason });
  }

  unblock(id: number) {
    return this.http.delete<BlockedEmail[]>(`${this.base}/blocked-emails/${id}`);
  }
}
