import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import {
  ActualizarEstadoDto,
  AmeliaBookingParamsDto,
  ReintentarNotificacionesDto,
  TelefonoParamsDto,
  TurnoIdParamsDto,
} from './dto/amelia.dto';
import { AmeliaService } from './amelia.service';

@Controller({ path: '', version: '1' })
export class AmeliaController {
  private readonly webhookSecret: string | undefined;

  constructor(
    private readonly service: AmeliaService,
    private readonly config: ConfigService,
  ) {
    this.webhookSecret = this.config.get<string>('AMELIA_WEBHOOK_SECRET');
  }

  @Post('webhook/amelia')
  async webhookAmelia(@Req() req: Request, @Body() body: any, @Query('token') token?: string) {
    const receivedToken = this.getWebhookToken(req, body, token);
    if (this.webhookSecret && receivedToken !== this.webhookSecret) {
      throw new HttpException(
        { success: false, error: 'No autorizado' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const payload = this.removeTokenFromBody(body);

    try {
      const turno = await this.service.procesarWebhook(payload);
      return {
        success: true,
        message: 'Turno procesado exitosamente',
        data: {
          id: turno.id,
          ameliaBookingId: turno.ameliaBookingId,
          nombreCompleto: turno.nombreCompleto,
          telefono: turno.telefono,
          fechaTurno: turno.fechaTurno,
          tipoLicencia: turno.tipoLicencia,
          notificacionEnviada: turno.notificacionEnviada,
        },
      };
    } catch (error: any) {
      const message = error?.message || 'Error interno al procesar el turno';
      const isBadRequest = message.toLowerCase().includes('payload') || message.toLowerCase().includes('booking');
      throw new HttpException(
        { success: false, error: message },
        isBadRequest ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(AdminApiKeyGuard)
  @Get('turnos-licencia/telefono/:telefono')
  async getTurnosPorTelefono(@Param() params: TelefonoParamsDto) {
    try {
      const turnos = await this.service.obtenerTurnosPorTelefono(params.telefono);
      return { success: true, count: turnos.length, data: turnos };
    } catch (error: any) {
      throw new HttpException(
        { success: false, error: 'Error al obtener turnos', message: error?.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(AdminApiKeyGuard)
  @Get('turnos-licencia/amelia/:ameliaBookingId')
  async getTurnoPorAmeliaId(@Param() params: AmeliaBookingParamsDto) {
    try {
      const turno = await this.service.buscarPorAmeliaBookingId(params.ameliaBookingId);
      if (!turno) {
        throw new HttpException(
          { success: false, error: 'Turno no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }

      return { success: true, data: turno };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { success: false, error: 'Error al obtener turno', message: error?.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(AdminApiKeyGuard)
  @Get('turnos-licencia/:id')
  async getTurnoPorId(@Param() params: TurnoIdParamsDto) {
    try {
      const turno = await this.service.obtenerTurnoPorId(params.id);
      if (!turno) {
        throw new HttpException(
          { success: false, error: 'Turno no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }

      return { success: true, data: turno };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { success: false, error: 'Error al obtener turno', message: error?.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(AdminApiKeyGuard)
  @Patch('turnos-licencia/:id/estado')
  async actualizarEstadoTurno(
    @Param() params: TurnoIdParamsDto,
    @Body() dto: ActualizarEstadoDto,
  ) {
    try {
      const turnoActualizado = await this.service.actualizarEstado(
        params.id,
        dto.estado,
        dto.usuarioId,
      );
      return {
        success: true,
        message: 'Estado actualizado exitosamente',
        data: turnoActualizado,
      };
    } catch (error: any) {
      const message = error?.message || 'Error al actualizar estado';
      const status = message.toLowerCase().includes('no encontrado')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ success: false, error: message }, status);
    }
  }

  @UseGuards(AdminApiKeyGuard)
  @Post('turnos-licencia/reintentar-notificaciones')
  async reintentarNotificaciones(@Body() dto: ReintentarNotificacionesDto) {
    try {
      await this.service.reintentarNotificacionesFallidas(dto.maxIntentos || 3);
      return { success: true, message: 'Proceso de reintento iniciado' };
    } catch (error: any) {
      throw new HttpException(
        { success: false, error: 'Error al reintentar notificaciones', message: error?.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private getWebhookToken(req: Request, body: any, queryToken?: string): string | undefined {
    const authHeader = req.headers['authorization'];
    const tokenFromHeader = typeof authHeader === 'string'
      ? authHeader.replace(/^Bearer\s+/i, '')
      : undefined;
    const tokenFromBody = body && typeof body === 'object' ? body.token : undefined;

    return tokenFromHeader || queryToken || tokenFromBody;
  }

  private removeTokenFromBody(body: any) {
    if (!body || typeof body !== 'object') return body;
    const clone = { ...body };
    if ('token' in clone) {
      delete clone.token;
    }
    return clone;
  }
}
