import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AmeliaWebhookDto {
  @IsOptional()
  @IsString()
  token?: string;

  @IsNotEmpty()
  payload!: Record<string, any>;
}

export class TurnoIdParamDto {
  @IsInt()
  id!: number;
}

export class AmeliaBookingIdParamDto {
  @IsInt()
  ameliaBookingId!: number;
}

export class TelefonoParamDto {
  @IsString()
  @IsNotEmpty()
  telefono!: string;
}

export class UpdateEstadoTurnoDto {
  @IsString()
  @IsNotEmpty()
  estado!: string;
}

export class ReintentarNotificacionesDto {
  @IsOptional()
  @IsBoolean()
  forzarReenvio?: boolean;
}
