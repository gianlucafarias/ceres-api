import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpsertBotConfigDto {
  @IsString()
  @IsNotEmpty()
  valor!: string;

  @IsBoolean()
  activo!: boolean;

  @IsOptional()
  @IsDateString()
  fecha_expiracion?: string | null;
}

export class BotConfigParamsDto {
  @IsString()
  @IsNotEmpty()
  clave!: string;
}
