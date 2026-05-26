import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RequestsService } from '../requests/requests.service';

@Injectable()
export class CleanupService {
	private readonly logger = new Logger(CleanupService.name);

	constructor(private readonly requestsService: RequestsService) {}

	/**
	 * Läuft täglich um 2:00 Uhr morgens
	 * Löscht alle Anfragen, die älter als 90 Tage sind (expiresAt)
	 */
	@Cron(CronExpression.EVERY_DAY_AT_2AM)
	async handleCleanup() {
		this.logger.log('Starte automatische Bereinigung abgeläfener Anfragen...');
		
		try {
			const deletedCount = await this.requestsService.cleanupExpiredRequests();
			this.logger.log(`✅ Bereinigung abgeschlossen: ${deletedCount} Anfrage(n) gelöscht`);
		} catch (error) {
			this.logger.error('❌ Fehler bei der automatischen Bereinigung:', error);
		}
	}
}

