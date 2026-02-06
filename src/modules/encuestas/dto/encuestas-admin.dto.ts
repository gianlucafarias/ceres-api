import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

type ContactValidation = {
  quiereContacto?: boolean;
  email?: string;
};

export class EncuestasQueryDto {
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

  @IsOptional()
  @IsString()
  barrio?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class EncuestaIdParamDto {
  @IsInt()
  id!: number;
}

export class EditarEncuestaDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') : value,
  )
  @IsString()
  @Matches(/^\d{7,8}$/)
  dni?: string;

  @IsOptional()
  @IsString()
  barrio?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  obrasUrgentes?: string[];

  @IsOptional()
  @IsString()
  obrasUrgentesOtro?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @IsString({ each: true })
  serviciosMejorar?: string[];

  @IsOptional()
  @IsString()
  serviciosMejorarOtro?: string;

  @IsOptional()
  @IsString()
  espacioMejorar?: string;

  @IsOptional()
  @IsString()
  propuesta?: string;

  @IsOptional()
  @IsBoolean()
  quiereContacto?: boolean;

  @ValidateIf((o: ContactValidation) => o.quiereContacto === true)
  @IsString()
  @IsNotEmpty()
  nombreCompleto?: string;

  @ValidateIf((o: ContactValidation) => o.quiereContacto === true)
  @IsString()
  @IsNotEmpty()
  telefono?: string;

  @ValidateIf((o: ContactValidation) => o.email !== undefined && o.email !== '')
  @IsEmail()
  email?: string;
}
