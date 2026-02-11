import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class VotanteDocumentoParamsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  documento!: string;
}

export class VotanteLookupResponseDto {
  mesa?: string;
  nombre?: string;
  documento?: string;
  orden?: string;
  direccion?: string;
  error?: string;
}

export class ImportarVotanteItemDto {
  @IsString()
  @IsNotEmpty()
  mesa!: string;

  @IsString()
  @IsNotEmpty()
  orden!: string;

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  direccion!: string;

  @IsString()
  @IsNotEmpty()
  documento!: string;

  @IsOptional()
  @IsString()
  clase?: string;

  @IsOptional()
  @IsString()
  anioNacimiento?: string;

  @IsOptional()
  @IsString()
  provincia?: string;

  @IsOptional()
  @IsString()
  departamento?: string;

  @IsOptional()
  @IsString()
  localidad?: string;
}

export class ImportarVotantesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportarVotanteItemDto)
  registros!: ImportarVotanteItemDto[];

  @IsOptional()
  @IsBoolean()
  reemplazar?: boolean;
}
