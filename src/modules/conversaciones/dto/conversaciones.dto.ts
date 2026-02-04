import { IsDateString, IsOptional } from 'class-validator';

export class ConversacionesQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
