import { Controller, Get } from '@nestjs/common';
import { RequestsService } from './requests/requests.service';

@Controller()
export class AppController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get('health')
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('api/sports')
  async getSports() {
    return this.requestsService.getAvailableSports();
  }
}
