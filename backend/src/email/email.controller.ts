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
   * Test-Endpoint zum Versenden einer Test-Email
   * GET /email/test?to=test@example.com
   */
  @Get('test')
  async testEmail(@Query('to') to: string) {
    if (!to) {
      return {
        success: false,
        message: 'Parameter "to" (Email-Adresse) ist erforderlich',
      };
    }

    const testData: RequestCreatedEmailData = {
      requestTitle: 'Test-Anfrage',
      sportart: 'Fussball',
      frontendUrl: 'http://localhost:4200',
      editUrl: 'http://localhost:4200/edit/test-token-123',
      deleteUrl: 'http://localhost:4200/delete/test-token-123',
    };

    const success = await this.emailService.sendRequestCreatedEmail(to, testData);

    return {
      success,
      message: success
        ? `Test-Email erfolgreich an ${to} gesendet`
        : `Fehler beim Versenden der Email an ${to}`,
    };
  }

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
