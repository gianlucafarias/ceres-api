import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class ContactsQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'updatedIn', 'lastInteraction'])
  sort?: 'createdAt' | 'updatedIn' | 'lastInteraction';

  @IsOptional()
  @IsString()
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
}
