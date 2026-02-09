import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class DashboardCeresitoSummaryQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  treatedStatus?: string;
}
