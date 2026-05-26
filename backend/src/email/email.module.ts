import { Module } from '@nestjs/common';
import { ApiKeyGuard } from '../common/api-key.guard';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';

@Module({
  controllers: [EmailController],
  providers: [EmailService, ApiKeyGuard],
  exports: [EmailService],
})
export class EmailModule {}

