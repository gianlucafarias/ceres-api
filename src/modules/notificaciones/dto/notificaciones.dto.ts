import {\n  IsArray,\n  IsBoolean,\n  IsInt,\n  IsNotEmpty,\n  IsOptional,\n  IsString,\n  Matches,\n  Max,\n  Min,\n} from 'class-validator';

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

export class EnviarTemplateDto {
  @IsString()
  @IsNotEmpty()
  number!: string;

  @IsString()
  @IsNotEmpty()
  template!: string;

  @IsOptional()
  @IsString()
  languageCode?: string;

  @IsOptional()
  @IsArray()
  components?: any[];
}

