import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { RequestsModule } from '../requests/requests.module';
import { SettingsModule } from '../settings/settings.module';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminController } from './admin.controller';
import { AdminGuard } from './admin.guard';

@Module({
  imports: [RequestsModule, SettingsModule, EmailModule],
  providers: [AdminAuthService, AdminGuard],
  controllers: [AdminAuthController, AdminController],
})
export class AdminModule {}
