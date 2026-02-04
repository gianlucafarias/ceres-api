import { IsDateString, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ReclamosFiltroAdminDto {
  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsString()
  prioridad?: string;

  @IsOptional()
  @IsString()
  barrio?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  per_page?: number = 10;

  @IsOptional()
  @IsString()
  sort?: string = 'id';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}

export class ReclamoIdParamDto {
  @IsInt()
  id!: number;
}

export class ActualizarReclamoAdminDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  reclamo?: string;

  @IsOptional()
  @IsString()
  ubicacion?: string;

  @IsOptional()
  @IsString()
  barrio?: string;

  @IsOptional()
  @IsString()
  detalle?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsString()
  prioridad?: string;

  @IsOptional()
  @IsNumber()
  cuadrillaId?: number;

  @IsOptional()
  @IsNumber()
  usuarioId?: number;
}
