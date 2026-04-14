import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, randomUUID } from 'crypto';
import { In, Repository } from 'typeorm';
import { QrTracking } from '../../entities/qr-tracking.entity';
import { CreateQrTrackingDto, QrTrackingQueryDto } from './dto/qr-tracking.dto';

type ResolveTrackedTargetResult = {
  id: string;
  targetUrl: string;
};

const MAX_SLUG_GENERATION_ATTEMPTS = 5;

@Injectable()
export class QrTrackingService {
  constructor(
    @InjectRepository(QrTracking)
    private readonly qrTrackingRepo: Repository<QrTracking>,
  ) {}

  async create(dto: CreateQrTrackingDto): Promise<QrTracking> {
    const targetUrl = dto.targetUrl.trim();
    const name = dto.name?.trim() || buildTrackingName(targetUrl);

    for (
      let attempt = 0;
      attempt < MAX_SLUG_GENERATION_ATTEMPTS;
      attempt += 1
    ) {
      const slug = createTrackingSlug();
      const existing = await this.qrTrackingRepo.findOne({
        where: { slug },
        select: { id: true },
      });

      if (existing) {
        continue;
      }

      const tracking = this.qrTrackingRepo.create({
        id: randomUUID(),
        slug,
        name,
        targetUrl,
      });

      return this.qrTrackingRepo.save(tracking);
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
        RETURNING id, target_url
      `,
      [slug],
    )) as Array<{ id: string; target_url: string }>;

    const row = result[0];

    if (!row) {
      throw new NotFoundException('QR tracking no encontrado');
    }

    return {
      id: row.id,
      targetUrl: row.target_url,
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

function createTrackingSlug(): string {
  return randomBytes(6).toString('hex');
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
