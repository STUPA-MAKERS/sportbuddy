import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import * as path from 'path';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface RequestCreatedEmailData {
  requestTitle: string;
  sport: string;
  knowledgeLevel?: string | null;
  runtimeDays: number;
  frontendUrl: string;
  verifyUrl: string;
  manageUrl: string;
}

export interface RequestUpdatedEmailData {
  requestTitle: string;
  frontendUrl: string;
  manageUrl: string;
}

export interface RequestDeletedEmailData {
  requestTitle: string;
  frontendUrl: string;
}

export interface RequestReplyEmailData {
  requestTitle: string;
  requestSport: string;
  senderName: string;
  senderEmail: string;
  message: string;
  frontendUrl: string;
  manageUrl: string;
}

export interface RequestHiddenEmailData {
  requestTitle: string;
  reason: string;
  message: string | null;
  frontendUrl: string;
  manageUrl: string;
}

export interface ReportNotificationEmailData {
  requestTitle: string;
  requestSport: string;
  reason: string;
  comment: string | null;
  openReports: number;
  autoHidden: boolean;
  adminUrl: string;
}

const TEMPLATE_DIR = path.join(__dirname, '..', '..', 'templates', 'emails');

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private readonly templates = new Map<string, Handlebars.TemplateDelegate>();

  constructor(private configService: ConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: Number(this.configService.get<string>('SMTP_PORT') ?? '587'),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized:
          this.configService.get<string>('SMTP_TLS_REJECT_UNAUTHORIZED') !== 'false',
      },
    });
    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP-Verbindung erfolgreich verifiziert');
    } catch (error) {
      this.logger.error('SMTP-Verbindung fehlgeschlagen:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM'),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
      });
      this.logger.log(`Email erfolgreich gesendet an ${options.to}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Fehler beim Versenden der Email an ${options.to}:`, error);
      return false;
    }
  }

  private send(to: string, subject: string, template: string, data: object, footnote?: string, text?: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
    const body = this.render(template, data);
    const html = this.render('layout', { subject, body, footnote, frontendUrl });
    return this.sendEmail({ to, subject, html, text });
  }

  sendRequestCreatedEmail(to: string, data: RequestCreatedEmailData) {
    return this.send(
      to,
      `Bitte bestätige deine Anfrage „${data.requestTitle}“`,
      'request-created',
      data,
      'Du bekommst diese E-Mail, weil jemand mit dieser Adresse eine Anfrage auf Sportbuddy erstellt hat. Warst du das nicht, ignoriere sie einfach: Ohne Bestätigung wird nichts veröffentlicht.',
    );
  }

  sendRequestUpdatedEmail(to: string, data: RequestUpdatedEmailData) {
    return this.send(to, `Deine Anfrage „${data.requestTitle}“ wurde gespeichert`, 'request-updated', data);
  }

  sendRequestDeletedEmail(to: string, data: RequestDeletedEmailData) {
    return this.send(to, `Deine Anfrage „${data.requestTitle}“ wurde gelöscht`, 'request-deleted', data);
  }

  sendRequestReplyEmail(to: string, data: RequestReplyEmailData) {
    return this.send(
      to,
      `Neue Nachricht zu „${data.requestTitle}“`,
      'request-reply',
      data,
      undefined,
      [
        `Neue Nachricht zu deiner Anfrage "${data.requestTitle}" (${data.requestSport})`,
        `Name: ${data.senderName}`,
        `E-Mail: ${data.senderEmail}`,
        '',
        data.message,
        '',
        `Anfrage verwalten: ${data.manageUrl}`,
      ].join('\n'),
    );
  }

  sendRequestHiddenEmail(to: string, data: RequestHiddenEmailData) {
    return this.send(to, `Deine Anfrage „${data.requestTitle}“ wurde ausgeblendet`, 'request-hidden', data);
  }

  sendReportNotificationEmail(to: string, data: ReportNotificationEmailData) {
    return this.send(to, `Sportbuddy-Meldung: „${data.requestTitle}“`, 'report-notification', data);
  }

  private render(name: string, data: object): string {
    let template = this.templates.get(name);
    if (!template) {
      const file = path.join(TEMPLATE_DIR, `${name}.hbs`);
      template = Handlebars.compile(fs.readFileSync(file, 'utf-8'));
      this.templates.set(name, template);
    }
    return template(data);
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<title[\s\S]*?<\/title>/gi, '')
      .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|h1|h2|tr|div)>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&#x3D;/g, '=')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n+/g, '\n\n')
      .trim();
  }
}
