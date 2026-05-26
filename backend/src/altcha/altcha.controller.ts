import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('api/altcha')
export class AltchaController {
  constructor(private readonly configService: ConfigService) {}

  @Get('challenge')
  async getChallenge() {
    const altchaUrl = this.configService.get<string>('ALTCHA_API_URL', 'http://altcha:8080');
    const res = await fetch(`${altchaUrl}/v1/challenge?maxnumber=200000`);
    if (!res.ok) {
      throw new InternalServerErrorException('Altcha-Service nicht erreichbar.');
    }
    return res.json();
  }
}
