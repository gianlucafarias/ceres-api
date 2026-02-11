import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CrearReclamoBotDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  telefono!: string;

  @IsString()
  @IsNotEmpty()
  reclamo!: string;

  @IsString()
  @IsNotEmpty()
  ubicacion!: string;

  @IsString()
  @IsNotEmpty()
  barrio!: string;

  @IsOptional()
  @IsString()
  detalle?: string;

  @IsOptional()
  @IsString()
  prioridad?: string;
}

export class EstadoReclamoBotParamsDto {
  @IsNumber()
  id!: number;
}

export class UltimoReclamoBotQueryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(40)
  telefono!: string;
}
