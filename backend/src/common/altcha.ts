import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifySolution } from 'altcha-lib';

/** How long a challenge can be solved and used. */
export const CHALLENGE_TTL_MS = 10 * 60 * 1000;

/** Signatures of solutions already used, with the time they may be forgotten. Single process. */
const used = new Map<string, number>();

function forgetExpired(now: number) {
  for (const [signature, until] of used) if (until <= now) used.delete(signature);
}

/** Verifies an ALTCHA solution, rejects expired challenges and lets each solution be used once. */
export async function assertAltcha(config: ConfigService, payload: string) {
  const key = config.get<string>('ALTCHA_HMAC_KEY');
  if (!key) throw new InternalServerErrorException('ALTCHA_HMAC_KEY not configured');
  if (!(await verifySolution(payload, key, true))) {
    throw new BadRequestException('Altcha-Verifizierung fehlgeschlagen.');
  }
  let signature: unknown;
  try {
    signature = JSON.parse(Buffer.from(payload, 'base64').toString('utf8')).signature;
  } catch {
    signature = undefined;
  }
  if (typeof signature !== 'string') throw new BadRequestException('Altcha-Verifizierung fehlgeschlagen.');
  const now = Date.now();
  forgetExpired(now);
  if (used.has(signature)) {
    throw new BadRequestException('Diese Prüfung wurde schon verwendet. Bitte löse sie erneut.');
  }
  used.set(signature, now + CHALLENGE_TTL_MS);
}
