import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ActivityLogService } from '../../shared/activity-log/activity-log.service';
import { WhatsappTemplateService } from '../../shared/whatsapp/whatsapp-template.service';
import { WhatsappComponent } from '../../shared/whatsapp/whatsapp.types';
import { AmeliaTurno } from '../../entities/amelia-turno.entity';
import { AmeliaWebhookParser } from './amelia-webhook.parser';
import { AmeliaTurnoService, EstadoTurno } from './amelia-turno.service';

@Injectable()
export class AmeliaService {
  private readonly templateConfirmado: string;
  private readonly templateCancelado: string;

  constructor(
    private readonly parser: AmeliaWebhookParser,
    private readonly turnoService: AmeliaTurnoService,
    private readonly activityLog: ActivityLogService,
    private readonly whatsapp: WhatsappTemplateService,
    private readonly config: ConfigService,
  ) {
    this.templateConfirmado = this.config.get<string>(
      'WHATSAPP_TEMPLATE_TURNO_LICENCIA',
      'turno_licencia_confirmado',
    );
    this.templateCancelado = this.config.get<string>(
      'WHATSAPP_TEMPLATE_TURNO_CANCELADO',
      'turno_licencia_cancelado',
    );
  }

  async procesarWebhook(rawPayload: unknown): Promise<AmeliaTurno> {
    const normalized = this.parser.normalize(rawPayload);
    const result = await this.turnoService.upsertFromWebhook(normalized);

    if (result.wasCreated) {
      await this.activityLog.logActivity({
        type: 'TURNO_LICENCIA',
        action: 'TURNO_CREADO',
        description: `Nuevo turno de licencia registrado - ${normalized.appointment.service.name}`,
        entityId: result.turno.id,
        metadata: {
          ameliaBookingId: result.turno.ameliaBookingId,
          telefono: result.turno.telefono,
          fechaTurno: format(result.turno.fechaTurno, 'dd/MM/yyyy HH:mm'),
          tipoLicencia: result.turno.tipoLicencia,
        },
      });

      await this.enviarNotificacionConfirmacion(result.turno);
      return result.turno;
    }

    if (
      result.estadoAnterior &&
      result.estadoNuevo &&
      result.estadoAnterior !== result.estadoNuevo
    ) {
      await this.activityLog.logActivity({
        type: 'TURNO_LICENCIA',
        action: 'ESTADO_CAMBIADO',
        description: `Turno ${result.turno.ameliaBookingId} cambio de estado: ${result.estadoAnterior} -> ${result.estadoNuevo}`,
        entityId: result.turno.id,
        metadata: {
          estadoAnterior: result.estadoAnterior,
          estadoNuevo: result.estadoNuevo,
          ameliaStatus: normalized.appointment.status,
        },
      });

      if (result.estadoNuevo === 'CANCELADO') {
        await this.enviarNotificacionCancelacion(result.turno);
      }
    }

    return result.turno;
  }

  async obtenerTurnosPorTelefono(telefono: string): Promise<AmeliaTurno[]> {
    return this.turnoService.obtenerTurnosPorTelefono(telefono);
  }

  async buscarPorAmeliaBookingId(
    ameliaBookingId: number,
  ): Promise<AmeliaTurno | null> {
    return this.turnoService.buscarPorAmeliaBookingId(ameliaBookingId);
  }

  async obtenerTurnoPorId(id: number): Promise<AmeliaTurno | null> {
    return this.turnoService.obtenerTurnoPorId(id);
  }

  async actualizarEstado(
    id: number,
    nuevoEstado: EstadoTurno,
    usuarioId?: number,
  ): Promise<AmeliaTurno> {
    const result = await this.turnoService.actualizarEstado(id, nuevoEstado);
    if (!result) {
      throw new Error('Turno no encontrado');
    }

    await this.activityLog.logActivity({
      type: 'TURNO_LICENCIA',
      action: 'ESTADO_ACTUALIZADO',
      description: `Estado de turno actualizado: ${result.estadoAnterior} -> ${nuevoEstado}`,
      entityId: result.turno.id,
      userId: usuarioId,
      metadata: {
        estadoAnterior: result.estadoAnterior,
        estadoNuevo: nuevoEstado,
        ameliaBookingId: result.turno.ameliaBookingId,
      },
    });

    return result.turno;
  }

  async reintentarNotificacionesFallidas(
    maxIntentos: number = 3,
  ): Promise<void> {
    const turnosSinNotificar =
      await this.turnoService.listarSinNotificar(maxIntentos);

    for (const turno of turnosSinNotificar) {
      await this.enviarNotificacionConfirmacion(turno);
      await this.sleep(2000);
    }
  }

  private async enviarNotificacionConfirmacion(
    turno: AmeliaTurno,
  ): Promise<void> {
    if (!this.turnoService.isTelefonoValido(turno.telefono)) {
      await this.turnoService.registrarErrorNotificacion(
        turno,
        `Telefono invalido: ${turno.telefono}`,
      );
      return;
    }

    try {
      const fechaFormateada = format(turno.fechaTurno, "EEEE d 'de' MMMM", {
        locale: es,
      });

      const components: WhatsappComponent[] = [
        {
          type: 'BODY',
          parameters: [
            { type: 'text', text: turno.nombreCompleto },
            { type: 'text', text: fechaFormateada },
            { type: 'text', text: turno.horaInicio },
            { type: 'text', text: turno.ubicacion || 'Municipalidad de Ceres' },
            { type: 'text', text: turno.tipoLicencia },
          ],
        },
      ];

      await this.whatsapp.sendTemplate({
        number: turno.telefono,
        template: this.templateConfirmado,
        languageCode: 'es_AR',
        components,
      });

      await this.turnoService.marcarNotificacionEnviada(turno);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      await this.turnoService.registrarErrorNotificacion(turno, message);
    }
  }

  private async enviarNotificacionCancelacion(
    turno: AmeliaTurno,
  ): Promise<void> {
    if (!this.turnoService.isTelefonoValido(turno.telefono)) {
      return;
    }

    try {
      const fechaFormateada = format(turno.fechaTurno, "EEEE d 'de' MMMM", {
        locale: es,
      });

      const components: WhatsappComponent[] = [
        {
          type: 'BODY',
          parameters: [
            { type: 'text', text: turno.nombreCompleto },
            { type: 'text', text: fechaFormateada },
            { type: 'text', text: turno.horaInicio },
          ],
        },
      ];

      await this.whatsapp.sendTemplate({
        number: turno.telefono,
        template: this.templateCancelado,
        languageCode: 'es_AR',
        components,
      });
    } catch {
      // swallow
    }
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
