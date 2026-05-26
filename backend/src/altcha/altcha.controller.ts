import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createChallenge } from 'altcha-lib';

@Controller('api/altcha')
export class AltchaController {
  constructor(private readonly configService: ConfigService) {}

  @Get('challenge')
  async getChallenge() {
    const hmacKey = this.configService.get<string>('ALTCHA_HMAC_KEY');
    if (!hmacKey) throw new InternalServerErrorException('ALTCHA_HMAC_KEY not configured');
    return createChallenge({ hmacKey, maxNumber: 200000 });
  }
}
