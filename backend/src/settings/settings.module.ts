import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockedEmailEntity } from './blocked-email.entity';
import { SettingsEntity } from './settings.entity';
import { SettingsService } from './settings.service';
import { SportEntity } from './sport.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SettingsEntity, SportEntity, BlockedEmailEntity]),
  ],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
