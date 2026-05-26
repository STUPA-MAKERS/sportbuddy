import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.configService.get<string>('API_SECRET');
    if (!secret) {
      throw new UnauthorizedException('API_SECRET not configured');
    }

    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.headers['x-api-key'];

    if (typeof provided !== 'string') {
      throw new UnauthorizedException('Invalid API key');
    }

    const secretBuf = Buffer.from(secret);
    const providedBuf = Buffer.from(provided);

    if (
      providedBuf.length !== secretBuf.length ||
      !crypto.timingSafeEqual(providedBuf, secretBuf)
    ) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
