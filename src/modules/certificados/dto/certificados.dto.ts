import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CrearCertificadoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  documentNumber!: string;
}
