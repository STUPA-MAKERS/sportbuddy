import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestEntity } from './request.entity';
import { PREDEFINED_SPORTS } from './sports.constants';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly repo: Repository<RequestEntity>,
  ) {}

  async create(request: Partial<RequestEntity>) {
    const entity = this.repo.create(request);
    return this.repo.save(entity);
  }

  async findAll(filter?: { sport?: string; take?: number; skip?: number }) {
    const where: Record<string, any> = { active: true };
    if (filter?.sport) where.sport = filter.sport;
    return this.repo.find({
      where,
      order: { createdAt: 'DESC' },
      take: filter?.take ?? 20,
      skip: filter?.skip ?? 0,
    });
  }

  async findPublicById(id: string) {
    return this.repo.findOne({
      where: { id, active: true },
    });
  }

  async findByEditToken(token: string) {
    return this.repo.findOne({ where: { editToken: token } });
  }

  async findByDeleteToken(token: string) {
    return this.repo.findOne({ where: { deleteToken: token } });
  }

  async activateByVerifyToken(token: string) {
    const entity = await this.repo.findOne({ where: { verifyToken: token } });
    if (!entity) return null;
    entity.active = true;
    entity.verifyToken = null;
    return this.repo.save(entity);
  }

  async updateByEditToken(token: string, updates: Partial<RequestEntity>) {
    const entity = await this.repo.findOne({ where: { editToken: token } });
    if (!entity) return null;
    Object.assign(entity, updates);
    return this.repo.save(entity);
  }

  async deleteByDeleteToken(token: string) {
    const entity = await this.repo.findOne({ where: { deleteToken: token } });
    if (!entity) return false;
    await this.repo.remove(entity);
    return true;
  }

  async getAvailableSports(): Promise<string[]> {
    return [...PREDEFINED_SPORTS].sort((left, right) => left.localeCompare(right, 'de'));
  }

  async cleanupExpiredRequests(): Promise<number> {
    const now = new Date();
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now })
      .execute();
    
    return result.affected || 0;
  }
}


