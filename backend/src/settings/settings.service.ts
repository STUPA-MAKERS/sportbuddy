import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DEFAULT_SPORTS } from '../requests/sports.constants';
import { BlockedEmailEntity } from './blocked-email.entity';
import { SettingsEntity } from './settings.entity';
import { SportEntity } from './sport.entity';

/** True when `email` matches a blocked address or a blocked `*@domain`. */
export function matchesBlockedPattern(email: string, pattern: string): boolean {
  const address = email.trim().toLowerCase();
  const p = pattern.trim().toLowerCase();
  if (p.startsWith('*@')) return address.endsWith(p.slice(1));
  return address === p;
}

export function normalizeBlockedPattern(raw: string): string {
  const p = raw.trim().toLowerCase();
  const domain = /^\*@[a-z0-9.-]+\.[a-z]{2,}$/;
  const address = /^[^\s@*]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (!domain.test(p) && !address.test(p)) {
    throw new BadRequestException(
      'Bitte eine E-Mail-Adresse oder *@domain.de eingeben.',
    );
  }
  return p;
}

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(SettingsEntity)
    private readonly settingsRepo: Repository<SettingsEntity>,
    @InjectRepository(SportEntity)
    private readonly sportRepo: Repository<SportEntity>,
    @InjectRepository(BlockedEmailEntity)
    private readonly blockedRepo: Repository<BlockedEmailEntity>,
  ) {}

  async onModuleInit() {
    if ((await this.sportRepo.count()) === 0) {
      await this.sportRepo.save(
        DEFAULT_SPORTS.map((s, position) =>
          this.sportRepo.create({ ...s, position, active: true }),
        ),
      );
      this.logger.log(`${DEFAULT_SPORTS.length} Sportarten angelegt`);
    }
    await this.get();
  }

  // --- settings ------------------------------------------------------------

  async get(): Promise<SettingsEntity> {
    let row = await this.settingsRepo.findOne({ where: { id: 1 } });
    if (!row) row = await this.settingsRepo.save(this.settingsRepo.create({ id: 1 }));
    return row;
  }

  async update(changes: Partial<Omit<SettingsEntity, 'id'>>) {
    const row = await this.get();
    Object.assign(row, changes);
    return this.settingsRepo.save(row);
  }

  // --- sports --------------------------------------------------------------

  listSports(includeInactive = false) {
    return this.sportRepo.find({
      where: includeInactive ? {} : { active: true },
      order: { position: 'ASC', id: 'ASC' },
    });
  }

  async isActiveSport(name: string) {
    return (await this.sportRepo.count({ where: { name, active: true } })) > 0;
  }

  async getSport(id: number) {
    const sport = await this.sportRepo.findOne({ where: { id } });
    if (!sport) throw new NotFoundException('Sportart nicht gefunden.');
    return sport;
  }

  async createSport(name: string, icon: string) {
    await this.assertNameFree(name);
    const last = await this.sportRepo.find({ order: { position: 'DESC' }, take: 1 });
    return this.sportRepo.save(
      this.sportRepo.create({
        name: name.trim(),
        icon,
        position: (last[0]?.position ?? -1) + 1,
        active: true,
      }),
    );
  }

  async updateSport(
    id: number,
    changes: { name?: string; icon?: string; active?: boolean },
  ): Promise<{ sport: SportEntity; previousName: string }> {
    const sport = await this.getSport(id);
    const previousName = sport.name;
    if (changes.name !== undefined && changes.name.trim() !== sport.name) {
      await this.assertNameFree(changes.name, sport.id);
      sport.name = changes.name.trim();
    }
    if (changes.icon !== undefined) sport.icon = changes.icon;
    if (changes.active !== undefined) sport.active = changes.active;
    return { sport: await this.sportRepo.save(sport), previousName };
  }

  async reorderSports(ids: number[]) {
    const sports = await this.sportRepo.find();
    const byId = new Map(sports.map((s) => [s.id, s]));
    ids.forEach((id, position) => {
      const sport = byId.get(id);
      if (sport) sport.position = position;
    });
    await this.sportRepo.save([...byId.values()]);
    return this.listSports(true);
  }

  async deleteSport(id: number) {
    await this.sportRepo.delete({ id });
  }

  private async assertNameFree(name: string, exceptId?: number) {
    const qb = this.sportRepo
      .createQueryBuilder('s')
      .where('LOWER(s.name) = LOWER(:name)', { name: name.trim() });
    if (exceptId !== undefined) qb.andWhere('s.id != :exceptId', { exceptId });
    const existing = await qb.getOne();
    if (existing) throw new ConflictException('Diese Sportart gibt es schon.');
  }

  // --- blocked emails ------------------------------------------------------

  listBlocked() {
    return this.blockedRepo.find({ order: { createdAt: 'DESC' } });
  }

  async block(rawPattern: string, reason: string | null) {
    const pattern = normalizeBlockedPattern(rawPattern);
    const existing = await this.blockedRepo.findOne({ where: { pattern } });
    if (existing) return existing;
    return this.blockedRepo.save(this.blockedRepo.create({ pattern, reason }));
  }

  async unblock(id: number) {
    await this.blockedRepo.delete({ id });
  }

  async isBlocked(email: string): Promise<boolean> {
    const all = await this.blockedRepo.find();
    return all.some((b) => matchesBlockedPattern(email, b.pattern));
  }
}
