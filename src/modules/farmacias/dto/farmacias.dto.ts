import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class PharmacyCodeParamsDto {
  @IsString()
  @Length(1, 50)
  code: string;
}

export class DutyDateParamsDto {
  @IsDateString()
  date: string;
}

export class DutyRangeQueryDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}

export class DutyByPharmacyQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(366)
  limit?: number;
}

export class UpdatePharmacyDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  address?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  phone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number | null;

  @IsOptional()
  @IsString()
  googleMapsAddress?: string | null;
}

export class UpdateDutyScheduleDto {
  @IsString()
  @Length(1, 50)
  pharmacyCode: string;
}
