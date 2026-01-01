import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

export interface RequestCreatedEmailData {
	recipientName?: string;
	requestTitle: string;
	sportart: string;
	editUrl: string;
	deleteUrl: string;
}

export interface RequestUpdatedEmailData {
	recipientName?: string;
	requestTitle: string;
	editUrl: string;
	deleteUrl: string;
}

@Injectable()
export class EmailService {
	private readonly logger = new Logger(EmailService.name);
	private transporter: nodemailer.Transporter;

	constructor(private configService: ConfigService) {
		this.initTransporter();
	}

	private initTransporter() {
		const smtpConfig = {
			host: this.configService.get<string>('SMTP_HOST'),
			port: this.configService.get<number>('SMTP_PORT') || 587,
			secure: this.configService.get<boolean>('SMTP_SECURE', true),
			auth: {
				user: this.configService.get<string>('SMTP_USER'),
				pass: this.configService.get<string>('SMTP_PASS'),
			},
			tls: {
				rejectUnauthorized: this.configService.get<boolean>(
					'SMTP_TLS_REJECT_UNAUTHORIZED',
					false,
				),
			},
		};

		this.transporter = nodemailer.createTransport(smtpConfig);

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

	/**
	 * Generische Methode zum Versenden von Emails
	 */
	async sendEmail(options: EmailOptions): Promise<boolean> {
		try {
			const mailOptions = {
				from: this.configService.get<string>('SMTP_FROM'),
				to: options.to,
				subject: options.subject,
				html: options.html,
				text: options.text || this.htmlToText(options.html),
			};

			const info = await this.transporter.sendMail(mailOptions);
			this.logger.log(`Email erfolgreich gesendet an ${options.to}: ${info.messageId}`);
			return true;
		} catch (error) {
			this.logger.error(`Fehler beim Versenden der Email an ${options.to}:`, error);
			return false;
		}
	}

	/**
	 * Email beim Erstellen einer neuen Anfrage
	 */
	async sendRequestCreatedEmail(
		to: string,
		data: RequestCreatedEmailData,
	): Promise<boolean> {
		const html = this.renderTemplate('request-created', data);
		return this.sendEmail({
			to,
			subject: `Sportpartnerbörse: Ihre Anfrage "${data.requestTitle}" wurde erstellt`,
			html,
		});
	}

	/**
	 * Email beim Aktualisieren einer Anfrage
	 */
	async sendRequestUpdatedEmail(
		to: string,
		data: RequestUpdatedEmailData,
	): Promise<boolean> {
		const html = this.renderTemplate('request-updated', data);
		return this.sendEmail({
			to,
			subject: `Sportpartnerbörse: Ihre Anfrage "${data.requestTitle}" wurde aktualisiert`,
			html,
		});
	}

	/**
	 * Email beim Löschen einer Anfrage
	 */
	async sendRequestDeletedEmail(
		to: string,
		requestTitle: string,
	): Promise<boolean> {
		const html = this.renderTemplate('request-deleted', { requestTitle });
		return this.sendEmail({
			to,
			subject: `Sportpartnerbörse: Ihre Anfrage "${requestTitle}" wurde gelöscht`,
			html,
		});
	}

	/**
	 * Email zur Erinnerung vor Ablauf (optional)
	 */
	async sendExpirationReminderEmail(
		to: string,
		data: { requestTitle: string; editUrl: string; daysLeft: number },
	): Promise<boolean> {
		const html = this.renderTemplate('expiration-reminder', data);
		return this.sendEmail({
			to,
			subject: `Sportpartnerbörse: Ihre Anfrage läuft in ${data.daysLeft} Tagen ab`,
			html,
		});
	}

	/**
	 * Rendert ein Email-Template mit Handlebars
	 */
	private renderTemplate(templateName: string, data: any): string {
		try {
			const templatePath = path.join(
				__dirname,
				'..',
				'..',
				'templates',
				'emails',
				`${templateName}.hbs`,
			);

			if (!fs.existsSync(templatePath)) {
				this.logger.warn(`Template nicht gefunden: ${templatePath}, verwende Fallback`);
				return this.getFallbackTemplate(templateName, data);
			}

			const templateContent = fs.readFileSync(templatePath, 'utf-8');
			const handlebars = require('handlebars');
			const template = handlebars.compile(templateContent);
			return template(data);
		} catch (error) {
			this.logger.error(`Fehler beim Rendern des Templates ${templateName}:`, error);
			return this.getFallbackTemplate(templateName, data);
		}
	}

	/**
	 * Fallback-Template falls Handlebars-Templates nicht verfügbar sind
	 */
	private getFallbackTemplate(templateName: string, data: any): string {
		const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');

		switch (templateName) {
			case 'request-created':
				return `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2>Ihre Anfrage wurde erstellt</h2>
              <p>Hallo${data.recipientName ? ' ' + data.recipientName : ''},</p>
              <p>Ihre Anfrage <strong>${data.requestTitle}</strong> (${data.sportart}) wurde erfolgreich erstellt.</p>
              <p>Sie können Ihre Anfrage bearbeiten oder löschen über die folgenden Links:</p>
              <ul>
                <li><a href="${data.editUrl}">Anfrage bearbeiten</a></li>
                <li><a href="${data.deleteUrl}">Anfrage löschen</a></li>
              </ul>
              <p>Bitte bewahren Sie diese Email auf, um später auf Ihre Anfrage zugreifen zu können.</p>
              <hr>
              <p style="font-size: 12px; color: #666;">Hochschule Reutlingen - Sportpartnerbörse</p>
            </body>
          </html>
        `;

			case 'request-updated':
				return `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2>Ihre Anfrage wurde aktualisiert</h2>
              <p>Hallo${data.recipientName ? ' ' + data.recipientName : ''},</p>
              <p>Ihre Anfrage <strong>${data.requestTitle}</strong> wurde erfolgreich aktualisiert.</p>
              <p>Sie können Ihre Anfrage weiterhin bearbeiten oder löschen:</p>
              <ul>
                <li><a href="${data.editUrl}">Anfrage bearbeiten</a></li>
                <li><a href="${data.deleteUrl}">Anfrage löschen</a></li>
              </ul>
              <hr>
              <p style="font-size: 12px; color: #666;">Hochschule Reutlingen - Sportpartnerbörse</p>
            </body>
          </html>
        `;

			case 'request-deleted':
				return `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2>Ihre Anfrage wurde gelöscht</h2>
              <p>Ihre Anfrage <strong>${data.requestTitle}</strong> wurde erfolgreich gelöscht.</p>
              <hr>
              <p style="font-size: 12px; color: #666;">Hochschule Reutlingen - Sportpartnerbörse</p>
            </body>
          </html>
        `;

			default:
				return `<p>${JSON.stringify(data)}</p>`;
		}
	}

	/**
	 * Konvertiert HTML zu Plain Text (einfache Implementierung)
	 */
	private htmlToText(html: string): string {
		return html
			.replace(/<[^>]*>/g, '')
			.replace(/&nbsp;/g, ' ')
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.trim();
	}
}

