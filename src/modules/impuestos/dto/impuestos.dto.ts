import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class PdfParamsDto {
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @IsString()
  @IsNotEmpty()
  partida: string;
}

export class ConsultarDeudaDto {
  @IsString()
  @IsNotEmpty()
  REGLOG: string;

  @IsString()
  @IsNotEmpty()
  ESTADO: string;
}

export class SolicitarCedulonDto {
  @Type(() => Number)
  @IsNumber()
  REGNRO: number;
}
