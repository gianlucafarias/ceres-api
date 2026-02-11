import { Type } from 'class-transformer';
import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ActivityQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  type?: string;
}

export class CreateActivityDto {
  @IsString()
  @MaxLength(50)
  type!: string;

  @IsString()
  @MaxLength(50)
  action!: string;

  @IsString()
  @MaxLength(255)
  description!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  entityId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
