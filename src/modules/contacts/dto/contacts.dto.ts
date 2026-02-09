import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class ContactsQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'updatedIn', 'lastInteraction'])
  sort?: 'createdAt' | 'updatedIn' | 'lastInteraction';

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC';
}

export class ContactIdParamDto {
  @IsInt()
  id!: number;
}

export class ConversationsRangeQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
