import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CrearReclamoDto {
  @IsDateString()
  fecha!: string;

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  reclamo!: string;

  @IsString()
  @IsNotEmpty()
  ubicacion!: string;

  @IsString()
  @IsNotEmpty()
  barrio!: string;

  @IsString()
  @IsNotEmpty()
  telefono!: string;

  @IsString()
  estado!: string;

  @IsString()
  detalle!: string;

  @IsString()
  prioridad!: string;

  @IsOptional()
  @IsNumber()
  latitud?: number;

  @IsOptional()
  @IsNumber()
  longitud?: number;
}

export class ActualizarReclamoDto {
  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsString()
  detalle?: string;

  @IsOptional()
  @IsString()
  prioridad?: string;

  @IsOptional()
  @IsNumber()
  latitud?: number;

  @IsOptional()
  @IsNumber()
  longitud?: number;

  @IsOptional()
  @IsNumber()
  cuadrillaid?: number;
}

export class ActualizarPrioridadDto {
  @IsString()
  @IsNotEmpty()
  prioridad!: string;
}

export class ReclamoIdParamDto {
  @IsNumber()
  id!: number;
}

export class ReclamoPdfParamsDto {
  @IsNumber()
  id!: number;
}
