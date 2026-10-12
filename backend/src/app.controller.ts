import { Controller, Get } from '@nestjs/common';
import { RequestsService } from './requests/requests.service';
import { SettingsService } from './settings/settings.service';

@Controller()
export class AppController {
  constructor(
    private readonly requestsService: RequestsService,
    private readonly settingsService: SettingsService,
  ) {}

  @Get('health')
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /** Active sports in the moderators' order, with the number of visible requests. */
  @Get('api/sports')
  async getSports() {
    const [sports, counts] = await Promise.all([
      this.settingsService.listSports(),
      this.requestsService.publicCountsBySport(),
    ]);
    return sports.map((s) => ({ name: s.name, icon: s.icon, count: counts.get(s.name) ?? 0 }));
  }

  @Get('api/config')
  async getConfig() {
    const { runtimeDays } = await this.settingsService.get();
    return { runtimeDays };
  }
}
