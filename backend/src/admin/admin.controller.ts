import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { RequestEntity } from '../requests/request.entity';
import { toManaged } from '../requests/request.mapper';
import { ModerationStatus, RequestsService } from '../requests/requests.service';
import { SettingsService } from '../settings/settings.service';
import { AdminAuthService } from './admin-auth.service';
import { AdminGuard, AdminRequest } from './admin.guard';
import {
  BlockDto,
  BulkDto,
  CreateSportDto,
  HideDto,
  ModeratorNotifyDto,
  ReorderDto,
  SettingsDto,
  UpdateSportDto,
} from './admin.dto';

const STATUSES: ReadonlyArray<ModerationStatus | 'all'> = ['review', 'unverified', 'online', 'hidden', 'all'];

@Controller('api/admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly requests: RequestsService,
    private readonly settings: SettingsService,
    private readonly email: EmailService,
    private readonly auth: AdminAuthService,
    private readonly config: ConfigService,
  ) {}

  private manageUrl(r: RequestEntity) {
    return `${this.auth.frontendUrl}/manage/${r.editToken}`;
  }

  // --- moderation ----------------------------------------------------------

  @Get('requests')
  async list(@Query('status') status?: string, @Query('q') q?: string) {
    const wanted = STATUSES.includes(status as ModerationStatus) ? (status as ModerationStatus | 'all') : 'review';
    const { counts, items } = await this.requests.listForModeration({ status: wanted, q: q?.slice(0, 100) });
    return {
      counts,
      items: items.map(({ request, openReports, status }) => ({
        id: request.id,
        title: request.title,
        sport: request.sport,
        knowledgeLevel: request.knowledgeLevel,
        createdAt: request.createdAt,
        expiresAt: request.expiresAt,
        pendingReview: request.pendingReview,
        status,
        openReports,
      })),
    };
  }

  @Get('requests/:id')
  async detail(@Param('id', ParseUUIDPipe) id: string) {
    const { request, reports, history, openReports, status } = await this.requests.getForModeration(id);
    return {
      ...toManaged(request),
      status,
      hiddenReason: request.hiddenReason,
      hiddenAt: request.hiddenAt,
      verifiedAt: request.verifiedAt,
      pendingReview: request.pendingReview,
      openReports,
      reports: reports.map((r) => ({
        id: r.id,
        reason: r.reason,
        comment: r.comment,
        dismissed: r.dismissed,
        createdAt: r.createdAt,
      })),
      history: history.map((h) => ({
        id: h.id,
        action: h.action,
        actor: h.actor,
        note: h.note,
        createdAt: h.createdAt,
      })),
    };
  }

  @Post('requests/:id/hide')
  @HttpCode(200)
  async hide(@Param('id', ParseUUIDPipe) id: string, @Body() body: HideDto, @Req() req: AdminRequest) {
    const { request } = await this.requests.getForModeration(id);
    const message = body.message?.trim() || null;
    await this.requests.hide(request, body.reason, req.admin.name, message);
    if (body.notify) {
      await this.email.sendRequestHiddenEmail(request.contactEmail, {
        requestTitle: request.title,
        reason: body.reason,
        message,
        frontendUrl: this.auth.frontendUrl,
        manageUrl: this.manageUrl(request),
      });
    }
    return this.detail(id);
  }

  @Post('requests/:id/unhide')
  @HttpCode(200)
  async unhide(@Param('id', ParseUUIDPipe) id: string, @Req() req: AdminRequest) {
    const { request } = await this.requests.getForModeration(id);
    await this.requests.unhide(request, req.admin.name);
    return this.detail(id);
  }

  /** "Meldungen verwerfen" / "Freigeben". */
  @Post('requests/:id/approve')
  @HttpCode(200)
  async approve(@Param('id', ParseUUIDPipe) id: string, @Req() req: AdminRequest) {
    const { request } = await this.requests.getForModeration(id);
    await this.requests.approve(request, req.admin.name);
    return this.detail(id);
  }

  @Post('requests/:id/resend-verification')
  @HttpCode(200)
  async resend(@Param('id', ParseUUIDPipe) id: string, @Req() req: AdminRequest) {
    const { request } = await this.requests.getForModeration(id);
    if (request.active || !request.verifyToken) {
      throw new BadRequestException('Die Anfrage ist schon bestätigt.');
    }
    const { runtimeDays } = await this.settings.get();
    request.verificationSentAt = new Date();
    await this.requests.save(request);
    await this.email.sendRequestCreatedEmail(request.contactEmail, {
      requestTitle: request.title,
      sport: request.sport,
      knowledgeLevel: request.knowledgeLevel,
      runtimeDays,
      frontendUrl: this.auth.frontendUrl,
      verifyUrl: `${this.auth.frontendUrl}/verify/${request.verifyToken}`,
      manageUrl: this.manageUrl(request),
    });
    await this.requests.log(request.id, 'verification-resent', req.admin.name);
    return this.detail(id);
  }

  @Delete('requests/:id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const { request } = await this.requests.getForModeration(id);
    await this.requests.remove(request);
    return { success: true };
  }

  @Post('requests/bulk')
  @HttpCode(200)
  async bulk(@Body() body: BulkDto, @Req() req: AdminRequest) {
    const found = await this.requests.findManyByIds(body.ids);
    for (const request of found) {
      if (body.action === 'delete') await this.requests.remove(request);
      else if (!request.hidden) await this.requests.hide(request, body.reason ?? 'Sonstiges', req.admin.name, null);
    }
    return { success: true, affected: found.length };
  }

  // --- settings ------------------------------------------------------------

  @Get('settings')
  async getSettings() {
    const s = await this.settings.get();
    return {
      runtimeDays: s.runtimeDays,
      autoHideThreshold: s.autoHideThreshold,
      reviewBeforePublish: s.reviewBeforePublish,
      notifyOnReport: s.notifyOnReport,
      moderationEmail: this.config.get<string>('MODERATION_EMAIL') || null,
      adminGroup: this.auth.adminGroup,
      moderators: (await this.settings.listModerators()).map((m) => ({
        sub: m.sub,
        name: m.name,
        email: m.email,
        notify: m.notify,
        lastLoginAt: m.lastLoginAt,
      })),
      recipients: await this.settings.moderationRecipients(this.config.get<string>('MODERATION_EMAIL')),
    };
  }

  @Put('moderators/:sub')
  async setModeratorNotify(@Param('sub') sub: string, @Body() body: ModeratorNotifyDto) {
    await this.settings.setModeratorNotify(sub, body.notify);
    return this.getSettings();
  }

  @Put('settings')
  async putSettings(@Body() body: SettingsDto) {
    await this.settings.update(body);
    return this.getSettings();
  }

  @Get('sports')
  async sports() {
    const [sports, counts] = await Promise.all([this.settings.listSports(true), this.requests.countsBySport()]);
    return sports.map((s) => ({ ...s, requests: counts.get(s.name) ?? 0 }));
  }

  @Post('sports')
  async createSport(@Body() body: CreateSportDto) {
    await this.settings.createSport(body.name, body.icon);
    return this.sports();
  }

  @Put('sports/order')
  async reorder(@Body() body: ReorderDto) {
    await this.settings.reorderSports(body.ids);
    return this.sports();
  }

  @Put('sports/:id')
  async updateSport(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateSportDto) {
    const { sport, previousName } = await this.settings.updateSport(id, body);
    await this.requests.renameSport(previousName, sport.name);
    return this.sports();
  }

  @Delete('sports/:id')
  async deleteSport(@Param('id', ParseIntPipe) id: number) {
    const sport = await this.settings.getSport(id);
    const counts = await this.requests.countsBySport();
    if ((counts.get(sport.name) ?? 0) > 0) {
      throw new ConflictException('Diese Sportart hat noch Anfragen. Du kannst sie nur ausblenden.');
    }
    await this.settings.deleteSport(id);
    return this.sports();
  }

  @Get('blocked-emails')
  blocked() {
    return this.settings.listBlocked();
  }

  @Post('blocked-emails')
  async block(@Body() body: BlockDto) {
    await this.settings.block(body.pattern, body.reason?.trim() || null);
    return this.settings.listBlocked();
  }

  @Delete('blocked-emails/:id')
  async unblock(@Param('id', ParseIntPipe) id: number) {
    await this.settings.unblock(id);
    return this.settings.listBlocked();
  }
}
