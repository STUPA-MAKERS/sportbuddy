import { Module } from '@nestjs/common';
import { AltchaController } from './altcha.controller';

@Module({
  controllers: [AltchaController],
})
export class AltchaModule {}
