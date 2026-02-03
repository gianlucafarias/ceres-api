import { IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

export class ConsultaGenericaDto {
  @IsNotEmpty()
  data!: Record<string, any>;
}

export class ConsultarDeudaDto {
  @IsString()
  @IsNotEmpty()
  OPE_NOM!: string;

  @IsString()
  @IsNotEmpty()
  OPE_PAS!: string;

  @IsString()
  @IsNotEmpty()
  FNC!: string;

  @IsString()
  @IsNotEmpty()
  REGLOG!: string;

  @IsString()
  @IsNotEmpty()
  ESTADO!: string;
}

export class SolicitarCedulonDto {
  @IsString()
  @IsNotEmpty()
  OPE_NOM!: string;

  @IsString()
  @IsNotEmpty()
  OPE_PAS!: string;

  @IsString()
  @IsNotEmpty()
  FNC!: string;

  @IsNumberString()
  REGNRO!: string;
}

export class GetPdfParamsDto {
  @IsString()
  @IsNotEmpty()
  tipo!: string;

  @IsString()
  @IsNotEmpty()
  partida!: string;
}
