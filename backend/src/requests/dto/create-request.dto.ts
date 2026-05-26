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

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  sport: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @IsEmail()
  @MaxLength(200)
  contactEmail: string;

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
