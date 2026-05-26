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
import { PREDEFINED_SPORTS } from '../sports.constants';

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(PREDEFINED_SPORTS)
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
  knowledgeLevel?: string;

  @IsOptional()
  @IsString()
  @IsIn(GENDER_OPTIONS)
  gender?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(120)
  age?: number;
}
