import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  OBS_EVENT_KINDS,
  OBS_EVENT_STATUSES,
} from '../observability.constants';

const normalizeString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : value;

const normalizeLower = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const normalizeOptionalInteger = (value: unknown): number | undefined => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export class QueryOpsEventsDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Transform(({ value }) => normalizeLower(value))
  source?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => normalizeLower(value))
  domain?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  @Transform(({ value }) => normalizeString(value))
  actorId?: string;

  @IsOptional()
  @IsEnum(OBS_EVENT_KINDS)
  @Transform(({ value }) => normalizeLower(value))
  kind?: (typeof OBS_EVENT_KINDS)[number];

  @IsOptional()
  @IsEnum(OBS_EVENT_STATUSES)
  @Transform(({ value }) => normalizeLower(value))
  status?: (typeof OBS_EVENT_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => normalizeLower(value))
  entityType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  @Transform(({ value }) => normalizeString(value))
  entityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  @Transform(({ value }) => normalizeString(value))
  requestId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  @Transform(({ value }) => normalizeString(value))
  query?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }: { value: unknown }) => normalizeOptionalInteger(value))
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }: { value: unknown }) => normalizeOptionalInteger(value))
  limit?: number;
}

export class QueryOpsSummaryDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Transform(({ value }) => normalizeLower(value))
  source?: string;
}
