import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { GENDER_OPTIONS, KNOWLEDGE_LEVELS } from '../request-options.constants';

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title: string;

  /** Checked against the active sports in the controller. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  sport: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  description: string;

  @IsEmail()
  @MaxLength(200)
  contactEmail: string;

  @IsString()
  @IsNotEmpty()
  altchaPayload: string;

  @IsOptional()
  @IsString()
  @IsIn(KNOWLEDGE_LEVELS)
  knowledgeLevel?: string | null;

  @IsOptional()
  @IsString()
  @IsIn(GENDER_OPTIONS)
  gender?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(120)
  age?: number | null;
}
