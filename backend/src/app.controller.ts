import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { RequestsService } from './requests/requests.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly requestsService: RequestsService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('api/sports')
  async getSports() {
    return this.requestsService.getAvailableSports();
  }
}

