import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifySolution } from 'altcha-lib';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';
import { CreateReplyDto } from './dto/create-reply.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestEntity } from './request.entity';
import { RequestsService } from './requests.service';

function generateToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

type PublicRequestResponse = Pick<
  RequestEntity,
  | 'id'
  | 'title'
  | 'sport'
  | 'description'
  | 'knowledgeLevel'
  | 'gender'
  | 'age'
  | 'active'
  | 'createdAt'
  | 'updatedAt'
  | 'expiresAt'
>;

type ManagedRequestResponse = PublicRequestResponse &
  Pick<RequestEntity, 'contactEmail' | 'editToken' | 'deleteToken'>;

@Controller('api/requests')
export class RequestsController {
  constructor(
    private readonly service: RequestsService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  private getAltchaKey(): string {
    const key = this.configService.get<string>('ALTCHA_HMAC_KEY');
    if (!key) throw new InternalServerErrorException('ALTCHA_HMAC_KEY not configured');
    return key;
  }

  @Post()
  async create(@Body() body: CreateRequestDto): Promise<PublicRequestResponse> {
    const valid = await verifySolution(body.altchaPayload, this.getAltchaKey());
    if (!valid) {
      throw new BadRequestException('Altcha-Verifizierung fehlgeschlagen.');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const editToken = generateToken();
    const deleteToken = generateToken();
    const verifyToken = generateToken();

    const request = await this.service.create({
      title: body.title,
      sport: body.sport,
      description: body.description,
      contactEmail: body.contactEmail,
      knowledgeLevel: body.knowledgeLevel ?? null,
      gender: body.gender ?? null,
      age: body.age ?? null,
      editToken,
      deleteToken,
      verifyToken,
      active: false,
      expiresAt,
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
    await this.emailService.sendRequestCreatedEmail(body.contactEmail, {
      requestTitle: body.title,
      sportart: body.sport,
      frontendUrl,
      verifyUrl: `${frontendUrl}/verify/${verifyToken}`,
      editUrl: `${frontendUrl}/edit/${editToken}`,
      deleteUrl: `${frontendUrl}/delete/${deleteToken}`,
    });

    return this.toPublicResponse(request);
  }

  @Get()
  async list(@Query('sport') sport?: string, @Query('skip') skip?: string, @Query('take') take?: string) {
    const rawTake = take ? parseInt(take, 10) : 20;
    const rawSkip = skip ? parseInt(skip, 10) : 0;
    const resolvedTake = Number.isFinite(rawTake) ? Math.min(Math.max(rawTake, 1), 100) : 20;
    const resolvedSkip = Number.isFinite(rawSkip) ? Math.max(rawSkip, 0) : 0;

    const requests = await this.service.findAll({ sport, skip: resolvedSkip, take: resolvedTake });
    return requests.map((request) => this.toPublicResponse(request));
  }

  @Get('manage/:token')
  async getByToken(@Param('token') token: string): Promise<ManagedRequestResponse> {
    const request = await this.service.findByEditToken(token);
    if (!request) {
      throw new NotFoundException('Anfrage nicht gefunden.');
    }
    return this.toManagedResponse(request);
  }

  @Get('delete-confirm/:token')
  async getDeleteConfirm(@Param('token') token: string): Promise<PublicRequestResponse> {
    const request = await this.service.findByDeleteToken(token);
    if (!request) {
      throw new NotFoundException('Anfrage nicht gefunden.');
    }
    return this.toPublicResponse(request);
  }

  @Get('verify/:token')
  async verifyEmail(@Param('token') token: string) {
    if (!token || token.length < 10) {
      throw new BadRequestException('Ungültiger Verifikationstoken.');
    }
    const request = await this.service.activateByVerifyToken(token);
    if (!request) {
      throw new NotFoundException('Verifikationslink ungültig oder bereits verwendet.');
    }
    return { success: true, requestId: request.id };
  }

  @Get(':id')
  async getPublicById(@Param('id') id: string): Promise<PublicRequestResponse> {
    const request = await this.service.findPublicById(id);
    if (!request) {
      throw new NotFoundException('Anfrage nicht gefunden.');
    }
    return this.toPublicResponse(request);
  }

  @Post(':id/replies')
  async createReply(@Param('id') id: string, @Body() body: CreateReplyDto) {
    const request = await this.service.findPublicById(id);
    if (!request) {
      throw new NotFoundException('Anfrage nicht gefunden.');
    }

    const valid = await verifySolution(body.altchaPayload, this.getAltchaKey());
    if (!valid) {
      throw new BadRequestException('Altcha-Verifizierung fehlgeschlagen.');
    }

    await this.emailService.sendRequestReplyEmail(request.contactEmail, {
      requestTitle: request.title,
      requestSport: request.sport,
      senderName: body.name,
      senderEmail: body.email,
      message: body.message,
    });

    return { success: true };
  }

  @Put('manage/:token')
  async updateByEditToken(
    @Param('token') token: string,
    @Body() updates: UpdateRequestDto,
  ): Promise<ManagedRequestResponse> {
    const request = await this.service.updateByEditToken(token, updates);
    if (!request) {
      throw new NotFoundException('Anfrage nicht gefunden.');
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
    await this.emailService.sendRequestUpdatedEmail(request.contactEmail, {
      requestTitle: request.title,
      frontendUrl,
      editUrl: `${frontendUrl}/edit/${request.editToken}`,
      deleteUrl: `${frontendUrl}/delete/${request.deleteToken}`,
    });

    return this.toManagedResponse(request);
  }

  @Delete('manage/:token')
  async deleteByDeleteToken(@Param('token') token: string) {
    const request = await this.service.findByDeleteToken(token);
    const success = await this.service.deleteByDeleteToken(token);

    if (success && request) {
      await this.emailService.sendRequestDeletedEmail(request.contactEmail, request.title);
    }

    return { success };
  }

  private toPublicResponse(request: RequestEntity): PublicRequestResponse {
    return {
      id: request.id,
      title: request.title,
      sport: request.sport,
      description: request.description,
      knowledgeLevel: request.knowledgeLevel,
      gender: request.gender,
      age: request.age,
      active: request.active,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      expiresAt: request.expiresAt,
    };
  }

  private toManagedResponse(request: RequestEntity): ManagedRequestResponse {
    return {
      ...this.toPublicResponse(request),
      contactEmail: request.contactEmail,
      editToken: request.editToken,
      deleteToken: request.deleteToken,
    };
  }
}
