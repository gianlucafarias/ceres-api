import { IsDateString, IsOptional } from 'class-validator';

export class VisitsRangeQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
