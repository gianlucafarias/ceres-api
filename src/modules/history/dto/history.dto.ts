import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class ConversationIdParamDto {
  @IsString()
  @IsNotEmpty()
  conversationId!: string;
}

export class ContactHistoryQueryDto {
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class ConversationDetailsQueryDto {
  @IsOptional()
  @IsInt()
  contactId?: number;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @IsInt()
  limit?: number = 10;
}

export class DateRangeQueryDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}

export class SendHumanMessageDto {
  @IsInt()
  @Min(1)
  contactId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  conversationId?: string;
}

export class HumanHandoffDto {
  @IsInt()
  @Min(1)
  contactId!: number;

  @IsString()
  @IsIn(['take', 'release'])
  action!: 'take' | 'release';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  conversationId?: string;
}
