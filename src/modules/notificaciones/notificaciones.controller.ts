import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import {
  ActualizarPreferenciasDto,
  ActualizarSeccionDto,
  PreferenciasParamsDto,
} from './dto/notificaciones.dto';

@Controller({ path: '', version: '1' })
export class NotificacionesController {
  constructor(private readonly service: NotificacionesService) {}

  @Post('preferencias')
  async actualizarPreferencias(@Body() dto: ActualizarPreferenciasDto) {
    const preferencias = await this.service.actualizarPreferencias(dto);
    return {
      success: true,
      mensaje: 'Preferencias actualizadas correctamente',
      preferencias: this.mapPreferencias(preferencias),
    };
  }

  @Get('preferencias/:contactId')
  async obtenerPreferencias(@Param() params: PreferenciasParamsDto) {
    const preferencias = await this.service.obtenerPreferencias(params.contactId);
    if (!preferencias) {
      throw new NotFoundException({ success: false, mensaje: 'Preferencias no encontradas' });
    }
    return {
      success: true,
      ...this.mapPreferencias(preferencias),
    };
  }

  @Post('seccion')
  async actualizarSeccion(@Body() dto: ActualizarSeccionDto) {
    await this.service.actualizarSeccion(dto);
    return {
      success: true,
      mensaje: 'Seccion actualizada correctamente',
      contact_id: dto.contact_id,
      seccion_id: dto.seccion_id,
    };
  }

  @Post('ejecutar-manual')
  async ejecutarManual() {
    await this.service.procesarNotificacionesDiarias('19:00');
    return { success: true, mensaje: 'Notificaciones ejecutadas correctamente' };
  }

  private mapPreferencias(preferencias: any) {
    return {
      ...preferencias,
      notificar_humedo: preferencias.notificarHumedo,
      notificar_seco: preferencias.notificarSeco,
      notificar_patio: preferencias.notificarPatio,
      hora_notificacion: preferencias.horaNotificacion,
    };
  }
}
