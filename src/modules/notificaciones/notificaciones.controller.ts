import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { BotApiKeyGuard } from '../../common/guards/bot-api-key.guard';
import { PreferenciasUsuario } from '../../entities/preferencias-usuario.entity';
import { NotificacionesService } from './notificaciones.service';
import {
  ActualizarPreferenciasDto,
  ActualizarSeccionDto,
  EnviarTemplateDto,
  PreferenciasParamsDto,
} from './dto/notificaciones.dto';

@Controller({ path: '', version: '1' })
export class NotificacionesController {
  constructor(private readonly service: NotificacionesService) {}

  @UseGuards(BotApiKeyGuard)
  @Post('preferencias')
  async actualizarPreferencias(@Body() dto: ActualizarPreferenciasDto) {
    const preferencias = await this.service.actualizarPreferencias(dto);
    return {
      success: true,
      mensaje: 'Preferencias actualizadas correctamente',
      preferencias: this.mapPreferencias(preferencias),
    };
  }

  @UseGuards(BotApiKeyGuard)
  @Get('preferencias/:contactId')
  async obtenerPreferencias(@Param() params: PreferenciasParamsDto) {
    const preferencias = await this.service.obtenerPreferencias(
      params.contactId,
    );
    if (!preferencias) {
      throw new NotFoundException({
        success: false,
        mensaje: 'Preferencias no encontradas',
      });
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

  @UseGuards(AdminApiKeyGuard)
  @Post('ejecutar-manual')
  async ejecutarManual() {
    await this.service.procesarNotificacionesDiarias('19:00');
    return {
      success: true,
      mensaje: 'Notificaciones ejecutadas correctamente',
    };
  }

  @UseGuards(AdminApiKeyGuard)
  @Post('whatsapp/template')
  async enviarTemplate(@Body() dto: EnviarTemplateDto) {
    await this.service.enviarTemplate(dto);
    return { success: true, mensaje: 'Template enviado correctamente' };
  }

  private mapPreferencias(preferencias: PreferenciasUsuario) {
    return {
      ...preferencias,
      notificar_humedo: preferencias.notificarHumedo,
      notificar_seco: preferencias.notificarSeco,
      notificar_patio: preferencias.notificarPatio,
      hora_notificacion: preferencias.horaNotificacion,
    };
  }
}
