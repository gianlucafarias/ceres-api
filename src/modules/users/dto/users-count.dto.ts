import { IsDateString, IsOptional } from 'class-validator';

export class UsersCountQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
