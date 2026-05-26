import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { EmailService } from './email.service';
import {
  RequestCreatedEmailData,
  RequestUpdatedEmailData,
} from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  /**
   * Versendet Email bei neuer Anfrage
   * POST /email/request-created
   */
  @Post('request-created')
  async sendRequestCreated(
    @Body()
    body: {
      to: string;
      data: RequestCreatedEmailData;
    },
  ) {
    const success = await this.emailService.sendRequestCreatedEmail(
      body.to,
      body.data,
    );

    return {
      success,
      message: success ? 'Email erfolgreich gesendet' : 'Fehler beim Versenden',
    };
  }

  /**
   * Versendet Email bei aktualisierter Anfrage
   * POST /email/request-updated
   */
  @Post('request-updated')
  async sendRequestUpdated(
    @Body()
    body: {
      to: string;
      data: RequestUpdatedEmailData;
    },
  ) {
    const success = await this.emailService.sendRequestUpdatedEmail(
      body.to,
      body.data,
    );

    return {
      success,
      message: success ? 'Email erfolgreich gesendet' : 'Fehler beim Versenden',
    };
  }

  /**
   * Versendet Email bei geloeschter Anfrage
   * POST /email/request-deleted
   */
  @Post('request-deleted')
  async sendRequestDeleted(
    @Body()
    body: {
      to: string;
      requestTitle: string;
    },
  ) {
    const success = await this.emailService.sendRequestDeletedEmail(
      body.to,
      body.requestTitle,
    );

    return {
      success,
      message: success ? 'Email erfolgreich gesendet' : 'Fehler beim Versenden',
    };
  }
}
