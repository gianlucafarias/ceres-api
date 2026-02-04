import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class ValidarDniDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\D/g, '') : value))
  @IsString()
  @Matches(/^\d{7,8}$/)
  dni!: string;
}

export class GuardarEncuestaDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\D/g, '') : value))
  @IsString()
  @Matches(/^\d{7,8}$/)
  dni!: string;

  @IsString()
  @IsNotEmpty()
  barrio!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  obrasUrgentes!: string[];

  @IsOptional()
  @IsString()
  obrasUrgentesOtro?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @IsString({ each: true })
  serviciosMejorar!: string[];

  @IsOptional()
  @IsString()
  serviciosMejorarOtro?: string;

  @IsOptional()
  @IsString()
  espacioMejorar?: string;

  @IsOptional()
  @IsString()
  propuesta?: string;

  @IsBoolean()
  quiereContacto!: boolean;

  @ValidateIf((o) => o.quiereContacto === true)
  @IsString()
  @IsNotEmpty()
  nombreCompleto?: string;

  @ValidateIf((o) => o.quiereContacto === true)
  @IsString()
  @IsNotEmpty()
  telefono?: string;

  @ValidateIf((o) => o.email !== undefined && o.email !== '')
  @IsEmail()
  email?: string;
}
