import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RequestsService } from '../requests/requests.service';

@Injectable()
export class CleanupService {
	private readonly logger = new Logger(CleanupService.name);

	constructor(private readonly requestsService: RequestsService) {}

	@Cron(CronExpression.EVERY_DAY_AT_2AM)
	async handleCleanup() {
		try {
			const deletedCount = await this.requestsService.cleanupExpiredRequests();
			this.logger.log(`Bereinigung: ${deletedCount} abgelaufene Anfrage(n) gelöscht`);
		} catch (error) {
			this.logger.error('Fehler bei der automatischen Bereinigung:', error);
		}
	}
}
