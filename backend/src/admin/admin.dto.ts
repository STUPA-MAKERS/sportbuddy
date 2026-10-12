import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { HIDE_REASONS } from '../requests/request-options.constants';

export class HideDto {
  @IsString()
  @IsIn(HIDE_REASONS)
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @IsBoolean()
  notify: boolean;
}

export class BulkDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsUUID('all', { each: true })
  ids: string[];

  @IsIn(['hide', 'delete'])
  action: 'hide' | 'delete';

  @IsOptional()
  @IsString()
  @IsIn(HIDE_REASONS)
  reason?: string;
}

export class SettingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  runtimeDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  autoHideThreshold?: number;

  @IsOptional()
  @IsBoolean()
  reviewBeforePublish?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnReport?: boolean;
}

const ICON = /^[a-z0-9_]{1,60}$/;

export class CreateSportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @IsString()
  @Matches(ICON)
  icon: string;
}

export class UpdateSportDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(ICON)
  icon?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class ReorderDto {
  @IsArray()
  @ArrayMaxSize(500)
  @IsInt({ each: true })
  ids: number[];
}

export class BlockDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  pattern: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reason?: string;
}

export class ModeratorNotifyDto {
  @IsBoolean()
  notify: boolean;
}
