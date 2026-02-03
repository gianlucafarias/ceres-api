import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
} from 'class-validator';

export class ValidarDniDto {
  @IsString()
  @Length(6, 20)
  dni!: string;
}

export class GuardarEncuestaDto {
  @IsString()
  @Length(6, 20)
  dni!: string;

  @IsString()
  @IsNotEmpty()
  barrio!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  obrasUrgentes!: string[];

  @IsOptional()
  @IsString()
  obrasUrgentesOtro?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
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

  @IsOptional()
  @IsString()
  nombreCompleto?: string;

  @IsOptional()
  @IsPhoneNumber('AR')
  telefono?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
