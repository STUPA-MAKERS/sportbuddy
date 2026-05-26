import { BadRequestException, Body, Controller, Get, InternalServerErrorException, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNotEmpty, IsString } from 'class-validator';
import { createChallenge, verifySolution } from 'altcha-lib';

class VerifyDto {
  @IsString()
  @IsNotEmpty()
  payload: string;
}

@Controller('api/altcha')
export class AltchaController {
  constructor(private readonly configService: ConfigService) {}

  private getKey(): string {
    const key = this.configService.get<string>('ALTCHA_HMAC_KEY');
    if (!key) throw new InternalServerErrorException('ALTCHA_HMAC_KEY not configured');
    return key;
  }

  @Get('challenge')
  async getChallenge() {
    return createChallenge({ hmacKey: this.getKey(), maxNumber: 200000 });
  }

  @Post('verify')
  async verify(@Body() body: VerifyDto) {
    const valid = await verifySolution(body.payload, this.getKey());
    if (!valid) throw new BadRequestException('Invalid altcha solution');
    return { success: true };
  }
}
