import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class TelefonoParamsDto {
  @IsString()
  telefono: string;
}

export class AmeliaBookingParamsDto {
  @Type(() => Number)
  @IsNumber()
  ameliaBookingId: number;
}

export class TurnoIdParamsDto {
  @Type(() => Number)
  @IsNumber()
  id: number;
}

export class ActualizarEstadoDto {
  @IsIn(['PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'COMPLETADO', 'NO_ASISTIO'])
  estado: 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO' | 'COMPLETADO' | 'NO_ASISTIO';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  usuarioId?: number;
}

export class ReintentarNotificacionesDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxIntentos?: number;
}
