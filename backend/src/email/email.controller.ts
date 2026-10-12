import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../common/api-key.guard';
import {
  EmailService,
  RequestCreatedEmailData,
  RequestDeletedEmailData,
  RequestUpdatedEmailData,
} from './email.service';

@Controller('email')
@UseGuards(ApiKeyGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  private result(success: boolean) {
    return { success, message: success ? 'Email erfolgreich gesendet' : 'Fehler beim Versenden' };
  }

  @Post('request-created')
  async sendRequestCreated(@Body() body: { to: string; data: RequestCreatedEmailData }) {
    return this.result(await this.emailService.sendRequestCreatedEmail(body.to, body.data));
  }

  @Post('request-updated')
  async sendRequestUpdated(@Body() body: { to: string; data: RequestUpdatedEmailData }) {
    return this.result(await this.emailService.sendRequestUpdatedEmail(body.to, body.data));
  }

  @Post('request-deleted')
  async sendRequestDeleted(@Body() body: { to: string; data: RequestDeletedEmailData }) {
    return this.result(await this.emailService.sendRequestDeletedEmail(body.to, body.data));
  }
}
