import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../common/api-key.guard';
import { EmailService, RequestCreatedEmailData, RequestUpdatedEmailData } from './email.service';

@Controller('email')
@UseGuards(ApiKeyGuard)
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
  ) {}

  @Post('request-created')
  async sendRequestCreated(@Body() body: { to: string; data: RequestCreatedEmailData }) {
    const success = await this.emailService.sendRequestCreatedEmail(body.to, body.data);
    return { success, message: success ? 'E-Mail erfolgreich gesendet' : 'Fehler beim Versenden' };
  }

  @Post('request-updated')
  async sendRequestUpdated(@Body() body: { to: string; data: RequestUpdatedEmailData }) {
    const success = await this.emailService.sendRequestUpdatedEmail(body.to, body.data);
    return { success, message: success ? 'E-Mail erfolgreich gesendet' : 'Fehler beim Versenden' };
  }

  @Post('request-deleted')
  async sendRequestDeleted(@Body() body: { to: string; requestTitle: string }) {
    const success = await this.emailService.sendRequestDeletedEmail(body.to, body.requestTitle);
    return { success, message: success ? 'E-Mail erfolgreich gesendet' : 'Fehler beim Versenden' };
  }
}
