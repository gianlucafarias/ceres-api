import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../../entities/activity-log.entity';
import { Reclamo } from '../../entities/reclamo.entity';
import { ReclamoHistorial } from '../../entities/reclamo-historial.entity';

const DEFAULT_ADMIN_ROLES = ['ADMIN'];

type RawStringRow = { tipo: string };
type RawIdRow = { id: number | string };

export type AdminBootstrapResponse = {
  tipoReclamos: string[];
  roles: string[];
  users: number[];
};

@Injectable()
export class AdminBootstrapService {
  constructor(
    @InjectRepository(Reclamo)
    private readonly reclamoRepo: Repository<Reclamo>,
    @InjectRepository(ReclamoHistorial)
    private readonly historialRepo: Repository<ReclamoHistorial>,
    @InjectRepository(ActivityLog)
    private readonly activityRepo: Repository<ActivityLog>,
    private readonly config: ConfigService,
  ) {}

  async getBootstrap(): Promise<AdminBootstrapResponse> {
    const [tiposRows, historialUsersRows, activityUsersRows] =
      await Promise.all([
        this.reclamoRepo.query(`
        SELECT DISTINCT TRIM(reclamo) AS tipo
        FROM reclamos
        WHERE reclamo IS NOT NULL
          AND TRIM(reclamo) <> ''
        ORDER BY tipo ASC
      `) as Promise<RawStringRow[]>,
        this.historialRepo.query(`
        SELECT DISTINCT usuario_id AS id
        FROM reclamo_historial
        WHERE usuario_id IS NOT NULL
      `) as Promise<RawIdRow[]>,
        this.activityRepo.query(`
        SELECT DISTINCT user_id AS id
        FROM activity_log
        WHERE user_id IS NOT NULL
      `) as Promise<RawIdRow[]>,
      ]);

    const tipoReclamos = tiposRows
      .map((row) => row.tipo)
      .filter(
        (tipo): tipo is string => typeof tipo === 'string' && tipo.length > 0,
      );

    const users = [
      ...new Set(
        [...historialUsersRows, ...activityUsersRows]
          .map((row) => toNumber(row.id))
          .filter((id): id is number => Number.isFinite(id)),
      ),
    ].sort((a, b) => a - b);

    return {
      tipoReclamos,
      roles: this.getRoles(),
      users,
    };
  }

  private getRoles(): string[] {
    const rawRoles = this.config.get<string>('ADMIN_BOOTSTRAP_ROLES', '');
    if (!rawRoles.trim()) {
      return DEFAULT_ADMIN_ROLES;
    }

    const roles = rawRoles
      .split(',')
      .map((role) => role.trim().toUpperCase())
      .filter((role) => role.length > 0);

    return roles.length > 0 ? Array.from(new Set(roles)) : DEFAULT_ADMIN_ROLES;
  }
}

function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number.parseInt(value, 10);
}
