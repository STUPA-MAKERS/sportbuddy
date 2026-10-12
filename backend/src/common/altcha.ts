import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifySolution } from 'altcha-lib';

export async function assertAltcha(config: ConfigService, payload: string) {
  const key = config.get<string>('ALTCHA_HMAC_KEY');
  if (!key) throw new InternalServerErrorException('ALTCHA_HMAC_KEY not configured');
  if (!(await verifySolution(payload, key))) {
    throw new BadRequestException('Altcha-Verifizierung fehlgeschlagen.');
  }
}
