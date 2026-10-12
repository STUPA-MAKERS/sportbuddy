import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { REPORT_REASONS } from '../request-options.constants';

export class CreateReportDto {
  @IsString()
  @IsIn(REPORT_REASONS)
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;

  @IsString()
  @IsNotEmpty()
  altchaPayload: string;
}
