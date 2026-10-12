import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository, SelectQueryBuilder } from 'typeorm';
import { HistoryAction, HistoryEntity } from './history.entity';
import { ReportEntity } from './report.entity';
import { RequestEntity } from './request.entity';

export type ModerationStatus = 'review' | 'unverified' | 'online' | 'hidden';

/** The one status a moderator sees for a request. Hidden wins over everything else. */
export function moderationStatus(
  request: Pick<RequestEntity, 'hidden' | 'active' | 'pendingReview'>,
  openReports: number,
): ModerationStatus {
  if (request.hidden) return 'hidden';
  if (!request.active) return 'unverified';
  if (request.pendingReview || openReports > 0) return 'review';
  return 'online';
}

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly repo: Repository<RequestEntity>,
    @InjectRepository(ReportEntity)
    private readonly reports: Repository<ReportEntity>,
    @InjectRepository(HistoryEntity)
    private readonly history: Repository<HistoryEntity>,
  ) {}

  // --- public --------------------------------------------------------------

  /** Requests anyone may see: confirmed, not hidden, not waiting for review, not expired. */
  private visible(qb: SelectQueryBuilder<RequestEntity>) {
    return qb
      .where('r.active = true')
      .andWhere('r.hidden = false')
      .andWhere('r.pendingReview = false')
      .andWhere('(r.expiresAt IS NULL OR r.expiresAt > :now)', { now: new Date() });
  }

  private search(qb: SelectQueryBuilder<RequestEntity>, q?: string, withEmail = false) {
    const term = q?.trim();
    if (!term) return qb;
    const like = `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    return qb.andWhere(
      new Brackets((w) => {
        w.where('r.title ILIKE :like', { like })
          .orWhere('r.description ILIKE :like', { like })
          .orWhere('r.sport ILIKE :like', { like });
        if (withEmail) w.orWhere('r.contactEmail ILIKE :like', { like });
      }),
    );
  }

  async listPublic(filter: { sport?: string; q?: string; skip: number; take: number }) {
    const qb = this.search(this.visible(this.repo.createQueryBuilder('r')), filter.q);
    if (filter.sport) qb.andWhere('r.sport = :sport', { sport: filter.sport });
    const [items, total] = await qb
      .orderBy('r.createdAt', 'DESC')
      .skip(filter.skip)
      .take(filter.take)
      .getManyAndCount();
    return { items, total };
  }

  /** Visible requests per sport, for the filter chips. */
  async publicCountsBySport(): Promise<Map<string, number>> {
    const rows = await this.visible(this.repo.createQueryBuilder('r'))
      .select('r.sport', 'sport')
      .addSelect('COUNT(*)', 'n')
      .groupBy('r.sport')
      .getRawMany<{ sport: string; n: string }>();
    return new Map(rows.map((row) => [row.sport, Number(row.n)]));
  }

  /** All requests that are not deleted, per sport (for the settings page). */
  async countsBySport(): Promise<Map<string, number>> {
    const rows = await this.repo
      .createQueryBuilder('r')
      .select('r.sport', 'sport')
      .addSelect('COUNT(*)', 'n')
      .groupBy('r.sport')
      .getRawMany<{ sport: string; n: string }>();
    return new Map(rows.map((row) => [row.sport, Number(row.n)]));
  }

  findPublicById(id: string) {
    return this.visible(this.repo.createQueryBuilder('r'))
      .andWhere('r.id = :id', { id })
      .getOne();
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async create(request: Partial<RequestEntity>) {
    const saved = await this.repo.save(this.repo.create(request));
    await this.log(saved.id, 'created');
    return saved;
  }

  /** The manage page accepts the edit token and, for older emails, the delete token. */
  findByManageToken(token: string) {
    if (!token || token.length < 10) return Promise.resolve(null);
    return this.repo.findOne({ where: [{ editToken: token }, { deleteToken: token }] });
  }

  async verify(token: string, reviewBeforePublish: boolean) {
    const entity = await this.repo.findOne({ where: { verifyToken: token } });
    if (!entity) return null;
    entity.active = true;
    entity.verifyToken = null;
    entity.verifiedAt = new Date();
    entity.pendingReview = reviewBeforePublish;
    const saved = await this.repo.save(entity);
    await this.log(saved.id, 'verified');
    return saved;
  }

  async save(entity: RequestEntity) {
    return this.repo.save(entity);
  }

  async update(entity: RequestEntity, updates: Partial<RequestEntity>) {
    Object.assign(entity, updates);
    const saved = await this.repo.save(entity);
    await this.log(saved.id, 'updated');
    return saved;
  }

  async extend(entity: RequestEntity, days: number) {
    entity.expiresAt = new Date(Date.now() + days * 86_400_000);
    const saved = await this.repo.save(entity);
    await this.log(saved.id, 'extended', null, `Läuft bis ${saved.expiresAt.toISOString()}`);
    return saved;
  }

  async remove(entity: RequestEntity) {
    await this.repo.remove(entity);
  }

  async renameSport(from: string, to: string) {
    if (from === to) return;
    await this.repo.update({ sport: from }, { sport: to });
  }

  // --- reports -------------------------------------------------------------

  openReportCount(requestId: string) {
    return this.reports.count({ where: { requestId, dismissed: false } });
  }

  /** Stores a report. Hides the request when it reaches the threshold (0 = never). */
  async report(
    request: RequestEntity,
    reason: string,
    comment: string | null,
    autoHideThreshold: number,
  ): Promise<{ autoHidden: boolean; openReports: number }> {
    await this.reports.save(this.reports.create({ requestId: request.id, reason, comment }));
    await this.log(request.id, 'reported', null, reason);
    const openReports = await this.openReportCount(request.id);
    if (autoHideThreshold > 0 && openReports >= autoHideThreshold && !request.hidden) {
      request.hidden = true;
      request.hiddenReason = 'Automatisch nach Meldungen';
      request.hiddenAt = new Date();
      await this.repo.save(request);
      await this.log(request.id, 'auto-hidden', null, `${openReports} Meldungen`);
      return { autoHidden: true, openReports };
    }
    return { autoHidden: false, openReports };
  }

  // --- moderation ----------------------------------------------------------

  private async openReportCounts(ids?: string[]): Promise<Map<string, number>> {
    const qb = this.reports
      .createQueryBuilder('p')
      .select('p.requestId', 'requestId')
      .addSelect('COUNT(*)', 'n')
      .where('p.dismissed = false')
      .groupBy('p.requestId');
    if (ids) {
      if (ids.length === 0) return new Map();
      qb.andWhere('p.requestId IN (:...ids)', { ids });
    }
    const rows = await qb.getRawMany<{ requestId: string; n: string }>();
    return new Map(rows.map((row) => [row.requestId, Number(row.n)]));
  }

  /** Every request with its moderation status, newest first, plus a count per status. */
  async listForModeration(filter: { status?: ModerationStatus | 'all'; q?: string }) {
    const all = await this.search(this.repo.createQueryBuilder('r'), filter.q, true)
      .orderBy('r.createdAt', 'DESC')
      .getMany();
    const open = await this.openReportCounts();
    const rows = all.map((request) => {
      const openReports = open.get(request.id) ?? 0;
      return { request, openReports, status: moderationStatus(request, openReports) };
    });
    const counts = { review: 0, unverified: 0, online: 0, hidden: 0, all: rows.length };
    for (const row of rows) counts[row.status]++;
    const status = filter.status ?? 'review';
    return {
      counts,
      items: status === 'all' ? rows : rows.filter((row) => row.status === status),
    };
  }

  async getForModeration(id: string) {
    const request = await this.repo.findOne({ where: { id } });
    if (!request) throw new NotFoundException('Anfrage nicht gefunden.');
    const [reports, history] = await Promise.all([
      this.reports.find({ where: { requestId: id }, order: { createdAt: 'DESC' } }),
      this.history.find({ where: { requestId: id }, order: { createdAt: 'DESC' } }),
    ]);
    const openReports = reports.filter((r) => !r.dismissed).length;
    return { request, reports, history, openReports, status: moderationStatus(request, openReports) };
  }

  async findManyByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return this.repo.find({ where: { id: In(ids) } });
  }

  async hide(request: RequestEntity, reason: string, actor: string, note: string | null) {
    request.hidden = true;
    request.hiddenReason = reason;
    request.hiddenAt = new Date();
    const saved = await this.repo.save(request);
    await this.log(request.id, 'hidden', actor, note ? `${reason}: ${note}` : reason);
    return saved;
  }

  async unhide(request: RequestEntity, actor: string) {
    request.hidden = false;
    request.hiddenReason = null;
    request.hiddenAt = null;
    const saved = await this.repo.save(request);
    // Reports that led to the hiding are settled once a moderator shows it again.
    await this.reports.update({ requestId: request.id, dismissed: false }, { dismissed: true });
    await this.log(request.id, 'unhidden', actor);
    return saved;
  }

  /** Releases a request: dismisses its open reports and ends a pending review. */
  async approve(request: RequestEntity, actor: string) {
    const open = await this.openReportCount(request.id);
    const wasPending = request.pendingReview;
    request.pendingReview = false;
    const saved = await this.repo.save(request);
    if (open > 0) {
      await this.reports.update({ requestId: request.id, dismissed: false }, { dismissed: true });
      await this.log(request.id, 'reports-dismissed', actor, `${open} Meldungen`);
    }
    if (wasPending) await this.log(request.id, 'approved', actor);
    return saved;
  }

  async log(requestId: string, action: HistoryAction, actor: string | null = null, note: string | null = null) {
    await this.history.save(this.history.create({ requestId, action, actor, note }));
  }

  async cleanupExpiredRequests(): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();
    return result.affected || 0;
  }
}
