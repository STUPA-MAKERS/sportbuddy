import { RequestEntity } from './request.entity';
import { ModerationStatus, moderationStatus } from './requests.service';

export interface PublicRequestResponse {
  id: string;
  title: string;
  sport: string;
  description: string;
  knowledgeLevel: string | null;
  gender: string | null;
  age: number | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
}

export interface ManagedRequestResponse extends PublicRequestResponse {
  contactEmail: string;
  status: ModerationStatus;
  hiddenReason: string | null;
}

export function toPublic(r: RequestEntity): PublicRequestResponse {
  return {
    id: r.id,
    title: r.title,
    sport: r.sport,
    description: r.description,
    knowledgeLevel: r.knowledgeLevel,
    gender: r.gender,
    age: r.age,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    expiresAt: r.expiresAt,
  };
}

export function toManaged(r: RequestEntity, openReports = 0): ManagedRequestResponse {
  // The creator does not learn about reports: an open report reads as "online".
  const status = moderationStatus(r, r.pendingReview ? openReports : 0);
  return {
    ...toPublic(r),
    contactEmail: r.contactEmail,
    status,
    hiddenReason: r.hidden ? r.hiddenReason : null,
  };
}
