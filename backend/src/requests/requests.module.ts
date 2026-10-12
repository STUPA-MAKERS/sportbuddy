import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '../email/email.module';
import { SettingsModule } from '../settings/settings.module';
import { HistoryEntity } from './history.entity';
import { ReportEntity } from './report.entity';
import { RequestEntity } from './request.entity';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RequestEntity, ReportEntity, HistoryEntity]),
    EmailModule,
    SettingsModule,
  ],
  providers: [RequestsService],
  controllers: [RequestsController],
  exports: [RequestsService],
})
export class RequestsModule {}
