import { IsBoolean, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class ActualizarPreferenciasDto {
  @IsInt()
  @Min(1)
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
  @Matches(/^\d{2}:\d{2}$/)
  hora_notificacion?: string;
}

export class PreferenciasParamsDto {
  @IsInt()
  @Min(1)
  contactId!: number;
}

export class ActualizarSeccionDto {
  @IsInt()
  @Min(1)
  contact_id!: number;

  @IsInt()
  @Min(1)
  @Max(4)
  seccion_id!: number;
}
