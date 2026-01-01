import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestEntity } from './request.entity';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

function generateToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

@Controller('api/requests')
export class RequestsController {
  constructor(
    private readonly service: RequestsService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

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
    const editToken = generateToken();
    const deleteToken = generateToken();
    
    const request = await this.service.create({
      title: body.title,
      sport: body.sport,
      description: body.description,
      contactEmail: body.contactEmail,
      editToken,
      deleteToken,
      active: true,
      expiresAt,
    });

    // Email mit Bearbeitungs-URLs versenden
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
    await this.emailService.sendRequestCreatedEmail(body.contactEmail, {
      requestTitle: body.title,
      sportart: body.sport,
      editUrl: `${frontendUrl}/edit/${editToken}`,
      deleteUrl: `${frontendUrl}/delete/${deleteToken}`,
    });

    return request;
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
    const request = await this.service.updateByEditToken(token, updates);
    
    if (request) {
      // Bestätigungs-Email versenden
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
      await this.emailService.sendRequestUpdatedEmail(request.contactEmail, {
        requestTitle: request.title,
        editUrl: `${frontendUrl}/edit/${request.editToken}`,
        deleteUrl: `${frontendUrl}/delete/${request.deleteToken}`,
      });
    }
    
    return request;
  }

  @Delete(':token')
  async deleteByDeleteToken(@Param('token') token: string) {
    const request = await this.service.findByToken(token);
    const success = await this.service.deleteByDeleteToken(token);
    
    if (success && request) {
      // Bestätigungs-Email versenden
      await this.emailService.sendRequestDeletedEmail(request.contactEmail, request.title);
    }
    
    return { success };
  }

}


