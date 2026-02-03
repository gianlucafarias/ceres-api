import { IsDateString, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdatePharmacyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @IsOptional()
  @IsString()
  googleMapsAddress?: string;
}

export class PharmacyCodeParamDto {
  @IsString()
  code!: string;
}

export class DutyDateParamDto {
  @IsDateString()
  date!: string;
}

export class DutyRangeQueryDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;
}
