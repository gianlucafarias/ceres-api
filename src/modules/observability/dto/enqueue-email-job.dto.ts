import { Type } from 'class-transformer';
import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  EMAIL_PROVIDER_STRATEGIES,
  EMAIL_TEMPLATE_KEYS,
  OBS_ACTOR_TYPES,
} from '../observability.constants';

const normalizeString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : value;

const normalizeLower = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class EmailJobActorDto {
  @IsOptional()
  @IsIn(OBS_ACTOR_TYPES)
  type?: (typeof OBS_ACTOR_TYPES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(191)
  id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  role?: string;
}

export class EnqueueEmailJobDto {
  @IsString()
  @IsIn(EMAIL_TEMPLATE_KEYS)
  templateKey!: (typeof EMAIL_TEMPLATE_KEYS)[number];

  @IsString()
  @MaxLength(320)
  recipient!: string;

  @IsString()
  @MaxLength(64)
  source!: string;

  @IsObject()
  payload!: Record<string, unknown>;

  @IsString()
  @MaxLength(191)
  idempotencyKey!: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  requestId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  entityType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  entityId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => EmailJobActorDto)
  actor?: EmailJobActorDto;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsIn(EMAIL_PROVIDER_STRATEGIES)
  providerStrategy?: (typeof EMAIL_PROVIDER_STRATEGIES)[number];
}
