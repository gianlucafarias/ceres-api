import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { In, QueryFailedError, Repository } from 'typeorm';
import { QrTracking } from '../../entities/qr-tracking.entity';
import { CreateQrTrackingDto, QrTrackingQueryDto } from './dto/qr-tracking.dto';

type ResolveTrackedTargetResult = {
  id: string;
  targetUrl: string;
};

const MAX_SLUG_GENERATION_ATTEMPTS = 50;
const MAX_SLUG_LENGTH = 160;
const RESERVED_SLUGS = new Set([
  'api',
  'admin',
  'chat',
  'favicon',
  'favicon-ico',
  'health',
  'media',
  'qr',
  'robots-txt',
  'v1',
  'webhook',
]);

@Injectable()
export class QrTrackingService {
  constructor(
    @InjectRepository(QrTracking)
    private readonly qrTrackingRepo: Repository<QrTracking>,
  ) {}

  async create(dto: CreateQrTrackingDto): Promise<QrTracking> {
    const targetUrl = dto.targetUrl.trim();
    const name = dto.name?.trim() || buildTrackingName(targetUrl);
    const baseSlug = buildTrackingSlugBase(name);

    for (
      let attempt = 0;
      attempt < MAX_SLUG_GENERATION_ATTEMPTS;
      attempt += 1
    ) {
      const slug = buildTrackingSlugCandidate(baseSlug, attempt);
      const tracking = this.qrTrackingRepo.create({
        id: randomUUID(),
        slug,
        name,
        targetUrl,
      });

      try {
        return await this.qrTrackingRepo.save(tracking);
      } catch (error) {
        if (isUniqueViolation(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new InternalServerErrorException(
      'No se pudo generar un slug unico para el QR',
    );
  }

  async findAll(query: QrTrackingQueryDto): Promise<QrTracking[]> {
    const ids = parseTrackingIds(query.ids);

    if (ids.length > 0) {
      return this.qrTrackingRepo.find({
        where: {
          id: In(ids),
        },
      });
    }

    return this.qrTrackingRepo.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<QrTracking> {
    const tracking = await this.qrTrackingRepo.findOne({
      where: { id },
    });

    if (!tracking) {
      throw new NotFoundException('QR tracking no encontrado');
    }

    return tracking;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.qrTrackingRepo.delete({ id });
    return (result.affected ?? 0) > 0;
  }

  async resolveTrackedTarget(
    slug: string,
  ): Promise<ResolveTrackedTargetResult> {
    const result = (await this.qrTrackingRepo.query(
      `
        UPDATE qr_tracking
        SET
          scan_count = scan_count + 1,
          last_scanned_at = NOW(),
          updated_at = NOW()
        WHERE slug = $1
        RETURNING id, target_url AS "targetUrl"
      `,
      [slug],
    )) as Array<{ id: string; targetUrl: string | null }>;

    const row = result[0];

    if (!row) {
      throw new NotFoundException('QR tracking no encontrado');
    }

    if (!row.targetUrl) {
      throw new InternalServerErrorException(
        'QR tracking sin targetUrl configurada',
      );
    }

    return {
      id: row.id,
      targetUrl: row.targetUrl,
    };
  }
}

function buildTrackingName(targetUrl: string): string {
  try {
    const parsedUrl = new URL(targetUrl);
    return parsedUrl.hostname.replace(/^www\./i, '') || 'QR tracking';
  } catch {
    return 'QR tracking';
  }
}

function buildTrackingSlugBase(name: string): string {
  const normalizedBase = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '');

  const safeBase = normalizedBase || 'qr';
  if (!RESERVED_SLUGS.has(safeBase)) {
    return safeBase;
  }

  return truncateSlugBase(`${safeBase}-link`, 0);
}

function buildTrackingSlugCandidate(baseSlug: string, attempt: number): string {
  if (attempt === 0) {
    return baseSlug;
  }

  const suffix = `-${attempt + 1}`;
  const truncatedBase = truncateSlugBase(baseSlug, suffix.length);
  return `${truncatedBase}${suffix}`;
}

function truncateSlugBase(baseSlug: string, suffixLength: number): string {
  const maxBaseLength = Math.max(1, MAX_SLUG_LENGTH - suffixLength);
  return baseSlug.slice(0, maxBaseLength).replace(/-+$/g, '') || 'qr';
}

function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }

  const driverError = error.driverError as { code?: string } | undefined;
  return driverError?.code === '23505';
}

function parseTrackingIds(rawIds?: string): string[] {
  if (!rawIds) {
    return [];
  }

  return Array.from(
    new Set(
      rawIds
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  );
}
