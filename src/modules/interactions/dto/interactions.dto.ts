import { IsDateString, IsIn, IsOptional } from 'class-validator';

export class InteractionsGroupParamsDto {
  @IsDateString()
  start_date!: string;

  @IsDateString()
  end_date!: string;

  @IsIn(['day', 'hour', 'keyword'])
  group_by!: 'day' | 'hour' | 'keyword';
}

export class InteractionsRangeParamsDto {
  @IsDateString()
  start_date!: string;

  @IsDateString()
  end_date!: string;
}

export class InteractionsCountQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
