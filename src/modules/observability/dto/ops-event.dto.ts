import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export const OPS_EVENT_SEVERITIES = [
  'info',
  'warn',
  'error',
  'critical',
] as const;
export type OpsEventSeverity = (typeof OPS_EVENT_SEVERITIES)[number];

export class OpsEventDto {
  @IsString()
  @Matches(/^[a-z0-9][a-z0-9_-]{1,31}$/)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  source!: string;

  @IsString()
  @Matches(/^[a-z0-9][a-z0-9_.-]{1,63}$/)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  type!: string;

  @IsOptional()
  @IsEnum(OPS_EVENT_SEVERITIES)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  severity?: OpsEventSeverity;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fingerprint?: string;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
