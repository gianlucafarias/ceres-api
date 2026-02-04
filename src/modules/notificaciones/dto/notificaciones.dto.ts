import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class WhatsappComponentParameterDto {
  @IsIn(['text'])
  type!: 'text';

  @IsString()
  text!: string;
}

class WhatsappComponentDto {
  @IsIn(['BODY', 'body'])
  type!: 'BODY' | 'body';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsappComponentParameterDto)
  parameters?: WhatsappComponentParameterDto[];
}

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
  @ValidateNested({ each: true })
  @Type(() => WhatsappComponentDto)
  components?: WhatsappComponentDto[];
}
