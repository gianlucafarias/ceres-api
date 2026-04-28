import { IsInt, IsString, Length, Min } from 'class-validator';

export class TipoReclamoIdParamDto {
  @IsInt()
  @Min(1)
  id!: number;
}

export class UpsertTipoReclamoDto {
  @IsString()
  @Length(2, 255)
  nombre!: string;
}
