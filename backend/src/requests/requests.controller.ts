import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestEntity } from './request.entity';
import * as crypto from 'crypto';

function generateToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

@Controller('api/requests')
export class RequestsController {
  constructor(private readonly service: RequestsService) {}

  @Post()
  async create(
    @Body()
    body: {
      title: string;
      sport: string;
      description: string;
      contactEmail: string;
    },
  ): Promise<RequestEntity> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    return this.service.create({
      title: body.title,
      sport: body.sport,
      description: body.description,
      contactEmail: body.contactEmail,
      editToken: generateToken(),
      deleteToken: generateToken(),
      active: true,
      expiresAt,
    });
  }

  @Get()
  async list(@Query('sport') sport?: string, @Query('skip') skip?: string, @Query('take') take?: string) {
    return this.service.findAll({
      sport,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 20,
    });
  }

  @Get(':token')
  async getByToken(@Param('token') token: string) {
    return this.service.findByToken(token);
  }

  @Put(':token')
  async updateByEditToken(
    @Param('token') token: string,
    @Body() updates: Partial<RequestEntity>,
  ) {
    return this.service.updateByEditToken(token, updates);
  }

  @Delete(':token')
  async deleteByDeleteToken(@Param('token') token: string) {
    return { success: await this.service.deleteByDeleteToken(token) };
  }
}


