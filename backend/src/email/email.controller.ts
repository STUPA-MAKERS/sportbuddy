import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import {
  RequestCreatedEmailData,
  RequestUpdatedEmailData,
} from './email.service';

@Controller('email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Test-Endpoint zum Versenden einer Test-E-Mail
   * GET /email/test?to=test@example.com
   */
  @Get('test')
  async testEmail(@Query('to') to: string) {
    if (!to) {
      return {
        success: false,
        message: 'Parameter "to" (E-Mail-Adresse) ist erforderlich',
      };
    }

    const testData: RequestCreatedEmailData = {
      requestTitle: 'Test-Anfrage',
      sportart: 'Fußball',
      frontendUrl: this.getFrontendUrl(),
      editUrl: this.getFrontendPath('/edit/test-token-123'),
      deleteUrl: this.getFrontendPath('/delete/test-token-123'),
    };

    const success = await this.emailService.sendRequestCreatedEmail(to, testData);

    return {
      success,
      message: success
        ? `Test-E-Mail erfolgreich an ${to} gesendet`
        : `Fehler beim Versenden der E-Mail an ${to}`,
    };
  }

  /**
   * Versendet E-Mail bei neuer Anfrage
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
      message: success ? 'E-Mail erfolgreich gesendet' : 'Fehler beim Versenden',
    };
  }

  /**
   * Versendet E-Mail bei aktualisierter Anfrage
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
      message: success ? 'E-Mail erfolgreich gesendet' : 'Fehler beim Versenden',
    };
  }

  /**
   * Versendet E-Mail bei gelöschter Anfrage
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
      message: success ? 'E-Mail erfolgreich gesendet' : 'Fehler beim Versenden',
    };
  }

  private getFrontendUrl(): string {
    return (
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('APP_URL') ||
      ''
    ).replace(/\/+$/, '');
  }

  private getFrontendPath(path: string): string {
    const frontendUrl = this.getFrontendUrl();
    return frontendUrl ? `${frontendUrl}${path}` : path;
  }
}
