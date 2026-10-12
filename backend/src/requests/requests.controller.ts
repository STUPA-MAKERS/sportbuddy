import * as crypto from 'crypto';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Ip,
  Logger,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { assertAltcha } from '../common/altcha';
import { generateToken } from '../common/tokens';
import { EmailService } from '../email/email.service';
import { SettingsService } from '../settings/settings.service';
import { CreateReplyDto } from './dto/create-reply.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestEntity } from './request.entity';
import { toManaged, toPublic } from './request.mapper';
import { RequestsService } from './requests.service';

const RESEND_COOLDOWN_MS = 2 * 60 * 1000;
const MAX_RESENDS = 5;

@Controller('api/requests')
export class RequestsController {
  private readonly logger = new Logger(RequestsController.name);

  constructor(
    private readonly service: RequestsService,
    private readonly settings: SettingsService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  private get frontendUrl() {
    return this.config.get<string>('FRONTEND_URL', 'http://localhost:4200');
  }

  /** Keyed hash of the client IP; the address itself is never stored. */
  private reporterHash(ip: string | undefined): string | null {
    const key = this.config.get<string>('ALTCHA_HMAC_KEY');
    if (!ip || !key) return null;
    return crypto.createHmac('sha256', key).update(`report:${ip}`).digest('hex');
  }

  /** One email per moderator, one after another, so no one sees the others' addresses. */
  private async notifyModerators(data: Parameters<EmailService['sendReportNotificationEmail']>[1]) {
    try {
      const recipients = await this.settings.moderationRecipients(this.config.get<string>('MODERATION_EMAIL'));
      for (const to of recipients) await this.emailService.sendReportNotificationEmail(to, data);
    } catch (error) {
      this.logger.error('Moderation konnte nicht benachrichtigt werden', error);
    }
  }

  private async assertNotBlocked(email: string) {
    if (await this.settings.isBlocked(email)) {
      throw new ForbiddenException('Mit dieser E-Mail-Adresse sind keine Anfragen möglich.');
    }
  }

  private async assertSport(sport: string) {
    if (!(await this.settings.isActiveSport(sport))) {
      throw new BadRequestException('Unbekannte Sportart.');
    }
  }

  private async sendVerification(request: RequestEntity, runtimeDays: number) {
    request.verificationSentAt = new Date();
    await this.service.save(request);
    return this.emailService.sendRequestCreatedEmail(request.contactEmail, {
      requestTitle: request.title,
      sport: request.sport,
      knowledgeLevel: request.knowledgeLevel,
      runtimeDays,
      frontendUrl: this.frontendUrl,
      verifyUrl: `${this.frontendUrl}/verify/${request.verifyToken}`,
      manageUrl: `${this.frontendUrl}/manage/${request.editToken}`,
    });
  }

  @Post()
  async create(@Body() body: CreateRequestDto) {
    await assertAltcha(this.config, body.altchaPayload);
    await this.assertSport(body.sport);
    await this.assertNotBlocked(body.contactEmail);
    const { runtimeDays } = await this.settings.get();

    const request = await this.service.create({
      title: body.title.trim(),
      sport: body.sport,
      description: body.description.trim(),
      contactEmail: body.contactEmail.trim(),
      knowledgeLevel: body.knowledgeLevel ?? null,
      gender: body.gender ?? null,
      age: body.age ?? null,
      editToken: generateToken(),
      deleteToken: generateToken(),
      verifyToken: generateToken(),
      active: false,
      expiresAt: new Date(Date.now() + runtimeDays * 86_400_000),
    });
    await this.sendVerification(request, runtimeDays);
    return { ...toPublic(request), contactEmail: request.contactEmail };
  }

  @Get()
  async list(
    @Query('sport') sport?: string,
    @Query('q') q?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const rawTake = take ? parseInt(take, 10) : 50;
    const rawSkip = skip ? parseInt(skip, 10) : 0;
    const { items, total } = await this.service.listPublic({
      sport: sport || undefined,
      q: q?.slice(0, 100),
      take: Number.isFinite(rawTake) ? Math.min(Math.max(rawTake, 1), 100) : 50,
      skip: Number.isFinite(rawSkip) ? Math.max(rawSkip, 0) : 0,
    });
    return { items: items.map(toPublic), total };
  }

  @Get('verify/:token')
  async verifyEmail(@Param('token') token: string) {
    if (!token || token.length < 10) {
      throw new BadRequestException('Ungültiger Verifikationstoken.');
    }
    const { reviewBeforePublish } = await this.settings.get();
    const request = await this.service.verify(token, reviewBeforePublish);
    if (!request) {
      throw new NotFoundException('Verifikationslink ungültig oder bereits verwendet.');
    }
    return {
      success: true,
      requestId: request.id,
      title: request.title,
      sport: request.sport,
      pendingReview: request.pendingReview,
      expiresAt: request.expiresAt,
    };
  }

  // --- manage (token from the email) ----------------------------------------

  private async byToken(token: string) {
    const request = await this.service.findByManageToken(token);
    if (!request) throw new NotFoundException('Anfrage nicht gefunden.');
    return request;
  }

  @Get('manage/:token')
  async getByToken(@Param('token') token: string) {
    const request = await this.byToken(token);
    const { runtimeDays } = await this.settings.get();
    return { ...toManaged(request), runtimeDays };
  }

  @Put('manage/:token')
  async updateByToken(@Param('token') token: string, @Body() updates: UpdateRequestDto) {
    const request = await this.byToken(token);
    if (updates.sport !== undefined && updates.sport !== request.sport) {
      await this.assertSport(updates.sport);
    }
    const { reviewBeforePublish } = await this.settings.get();
    const contentChanged =
      (updates.title !== undefined && updates.title.trim() !== request.title) ||
      (updates.description !== undefined && updates.description.trim() !== request.description) ||
      (updates.sport !== undefined && updates.sport !== request.sport);
    const saved = await this.service.update(request, {
      // With review before publishing on, changed content goes back into the queue.
      ...(reviewBeforePublish && request.active && contentChanged && { pendingReview: true }),
      ...(updates.title !== undefined && { title: updates.title.trim() }),
      ...(updates.sport !== undefined && { sport: updates.sport }),
      ...(updates.description !== undefined && { description: updates.description.trim() }),
      ...(updates.knowledgeLevel !== undefined && { knowledgeLevel: updates.knowledgeLevel }),
      ...(updates.gender !== undefined && { gender: updates.gender }),
      ...(updates.age !== undefined && { age: updates.age }),
    });
    await this.emailService.sendRequestUpdatedEmail(saved.contactEmail, {
      requestTitle: saved.title,
      frontendUrl: this.frontendUrl,
      manageUrl: `${this.frontendUrl}/manage/${saved.editToken}`,
    });
    const { runtimeDays } = await this.settings.get();
    return { ...toManaged(saved), runtimeDays };
  }

  @Post('manage/:token/extend')
  @HttpCode(200)
  async extend(@Param('token') token: string) {
    const request = await this.byToken(token);
    const { runtimeDays } = await this.settings.get();
    const saved = await this.service.extend(request, runtimeDays);
    return { ...toManaged(saved), runtimeDays };
  }

  @Delete('manage/:token')
  async deleteByToken(@Param('token') token: string) {
    const request = await this.byToken(token);
    await this.service.remove(request);
    await this.emailService.sendRequestDeletedEmail(request.contactEmail, {
      requestTitle: request.title,
      frontendUrl: this.frontendUrl,
    });
    return { success: true };
  }

  // --- public by id --------------------------------------------------------

  @Get(':id')
  async getPublicById(@Param('id', ParseUUIDPipe) id: string) {
    const request = await this.service.findPublicById(id);
    if (!request) throw new NotFoundException('Anfrage nicht gefunden.');
    return toPublic(request);
  }

  @Post(':id/replies')
  async createReply(@Param('id', ParseUUIDPipe) id: string, @Body() body: CreateReplyDto) {
    const request = await this.service.findPublicById(id);
    if (!request) throw new NotFoundException('Anfrage nicht gefunden.');
    await assertAltcha(this.config, body.altchaPayload);
    await this.assertNotBlocked(body.email);

    const sent = await this.emailService.sendRequestReplyEmail(request.contactEmail, {
      requestTitle: request.title,
      requestSport: request.sport,
      senderName: body.name,
      senderEmail: body.email,
      message: body.message,
      frontendUrl: this.frontendUrl,
      manageUrl: `${this.frontendUrl}/manage/${request.editToken}`,
    });
    if (!sent) {
      throw new HttpException('Die Nachricht konnte nicht gesendet werden.', HttpStatus.BAD_GATEWAY);
    }
    return { success: true };
  }

  @Post(':id/reports')
  @HttpCode(201)
  async report(@Param('id', ParseUUIDPipe) id: string, @Body() body: CreateReportDto, @Ip() ip: string) {
    const request = await this.service.findPublicById(id);
    if (!request) throw new NotFoundException('Anfrage nicht gefunden.');
    await assertAltcha(this.config, body.altchaPayload);

    const settings = await this.settings.get();
    const comment = body.comment?.trim() || null;
    const { duplicate, autoHidden, openReports } = await this.service.report(
      request,
      body.reason,
      comment,
      settings.autoHideThreshold,
      this.reporterHash(ip),
    );
    if (!duplicate && settings.notifyOnReport) {
      // In the background, so a slow mail server never holds up the reporter.
      void this.notifyModerators({
        requestTitle: request.title,
        requestSport: request.sport,
        reason: body.reason,
        comment,
        openReports,
        autoHidden,
        adminUrl: `${this.frontendUrl}/admin/moderation/${request.id}`,
      });
    }
    return { success: true };
  }

  /** "E-Mail erneut senden" on the done page. Rate limited, only before confirmation. */
  @Post(':id/resend-verification')
  @HttpCode(200)
  async resendVerification(@Param('id', ParseUUIDPipe) id: string) {
    const request = await this.service.findById(id);
    if (!request || request.active || !request.verifyToken) {
      throw new NotFoundException('Keine unbestätigte Anfrage gefunden.');
    }
    if (!(await this.service.claimVerificationResend(request.id, MAX_RESENDS, RESEND_COOLDOWN_MS))) {
      throw new HttpException(
        'Bitte warte einen Moment, bevor du die E-Mail noch einmal anforderst.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    request.verificationResends += 1;
    await this.service.log(request.id, 'verification-resent');
    const { runtimeDays } = await this.settings.get();
    await this.sendVerification(request, runtimeDays);
    return { success: true };
  }
}
