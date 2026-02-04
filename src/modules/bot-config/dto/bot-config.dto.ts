import { IsBoolean, IsDateString, IsOptional, IsString, Length } from 'class-validator';

export class BotConfigKeyParamsDto {
  @IsString()
  @Length(1, 255)
  clave: string;
}

export class CreateBotConfigDto {
  @IsString()
  valor: string;

  @IsBoolean()
  activo: boolean;

  @IsOptional()
  @IsDateString()
  fecha_expiracion?: string | null;
}

export class UpdateBotConfigDto {
  @IsString()
  valor: string;

  @IsBoolean()
  activo: boolean;

  @IsOptional()
  @IsDateString()
  fecha_expiracion?: string | null;
}
