import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ActualizarPreferenciasDto {
  @IsInt()
  contact_id!: number;

  @IsOptional()
  @IsBoolean()
  notificar_humedo?: boolean;

  @IsOptional()
  @IsBoolean()
  notificar_seco?: boolean;

  @IsOptional()
  @IsBoolean()
  notificar_patio?: boolean;

  @IsOptional()
  @IsString()
  hora_notificacion?: string;
}

export class ObtenerPreferenciasParamsDto {
  @IsInt()
  contactId!: number;
}

export class ActualizarSeccionDto {
  @IsInt()
  contact_id!: number;

  @IsInt()
  seccion_id!: number;
}

export class EjecutarNotificacionesManualDto {
  @IsOptional()
  @IsString()
  hora_objetivo?: string;
}
