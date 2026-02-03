import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BuscarVotanteParamsDto {
  @IsString()
  @IsNotEmpty()
  documento!: string;
}

export class ImportarVotantesDto {
  @IsString()
  @IsNotEmpty()
  filePath!: string;

  @IsOptional()
  @IsString()
  delimiter?: string;
}
