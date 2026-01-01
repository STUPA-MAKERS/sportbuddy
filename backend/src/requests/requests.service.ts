import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestEntity } from './request.entity';

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

  async findByToken(token: string) {
    return this.repo.findOne({
      where: [{ editToken: token }, { deleteToken: token }],
    });
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
}


