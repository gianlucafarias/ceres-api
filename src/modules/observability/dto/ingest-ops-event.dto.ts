import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  OBS_ACTOR_TYPES,
  OBS_EVENT_KINDS,
  OBS_EVENT_STATUSES,
} from '../observability.constants';

const normalizeString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : value;

const normalizeLower = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class IngestOpsEventDto {
  @IsString()
  @MaxLength(64)
  @Transform(({ value }) => normalizeLower(value))
  source!: string;

  @IsEnum(OBS_EVENT_KINDS)
  @Transform(({ value }) => normalizeLower(value))
  kind!: (typeof OBS_EVENT_KINDS)[number];

  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => normalizeLower(value))
  domain!: string;

  @IsString()
  @MaxLength(191)
  @Transform(({ value }) => normalizeLower(value))
  eventName!: string;

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
  @IsEnum(OBS_ACTOR_TYPES)
  @Transform(({ value }) => normalizeLower(value))
  actorType?: (typeof OBS_ACTOR_TYPES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(191)
  @Transform(({ value }) => normalizeString(value))
  actorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  @Transform(({ value }) => normalizeString(value))
  actorLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  @Transform(({ value }) => normalizeString(value))
  actorEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => normalizeString(value))
  actorRole?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  @Transform(({ value }) => normalizeString(value))
  requestId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => normalizeString(value))
  route?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => normalizeString(value))
  path?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  method?: string;

  @IsEnum(OBS_EVENT_STATUSES)
  @Transform(({ value }) => normalizeLower(value))
  status!: (typeof OBS_EVENT_STATUSES)[number];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    const parsed =
      typeof value === 'string' ? Number.parseInt(value, 10) : Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  })
  durationMs?: number;

  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => normalizeString(value))
  summary!: string;

  @IsOptional()
  @IsObject()
  changes?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}
