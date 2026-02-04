import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Repository } from 'typeorm';
import { ActivityLog } from '../../entities/activity-log.entity';
import { AmeliaTurno } from '../../entities/amelia-turno.entity';
import {
  isValidArgentinePhone,
  normalizeArgentinePhone,
} from './phone-normalizer';

interface AmeliaWebhookPayload {
  appointment: {
    id: number;
    status: string;
    serviceId: number;
    bookingStart: string;
    bookingEnd: string;
    service: {
      id: number;
      name: string;
      description?: string;
    };
    provider?: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
    location?: {
      name: string;
      address?: string;
    };
    bookings: Record<string, any>;
  };
  bookings: Record<string, any>;
}

@Injectable()
export class AmeliaService {
  private readonly whatsappApiUrl = 'https://api.ceres.gob.ar/v1/template';
  private readonly templateConfirmado: string;
  private readonly templateCancelado: string;

  constructor(
    @InjectRepository(AmeliaTurno)
    private readonly turnoRepo: Repository<AmeliaTurno>,
    @InjectRepository(ActivityLog)
    private readonly activityRepo: Repository<ActivityLog>,
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

  async procesarWebhook(rawPayload: any): Promise<AmeliaTurno> {
    const { appointment, bookings } = this.normalizePayload(rawPayload);
    const sanitizedPayload = this.sanitizePayload(rawPayload);

    const firstBookingKey = Object.keys(bookings)[0];
    const booking = bookings[firstBookingKey];

    if (!booking) {
      throw new Error('No se encontro informacion de booking en el payload');
    }

    const existente = await this.buscarPorAmeliaBookingId(Number(booking.id));
    if (existente) {
      return this.actualizarTurno(existente, appointment, sanitizedPayload);
    }

    const telefonoOriginal = booking.customer?.phone || booking.infoArray?.phone || '';
    const phoneResult = normalizeArgentinePhone(telefonoOriginal, '3564');

    let dni: string | undefined;
    let ciudad: string | undefined;

    if (booking.customFields) {
      for (const key of Object.keys(booking.customFields)) {
        const field = booking.customFields[key];
        if (field?.label?.toLowerCase().includes('dni')) {
          dni = field.value;
        }
        if (field?.label?.toLowerCase().includes('ciudad')) {
          ciudad = field.value;
        }
      }
    }

    const customerFirstName = booking.customer?.firstName || '';
    const customerLastName = booking.customer?.lastName || '';
    let nombreCompleto = `${customerFirstName} ${customerLastName}`.trim();
    if (booking.infoArray?.firstName) {
      nombreCompleto = `${booking.infoArray.firstName} ${booking.infoArray.lastName || ''}`.trim();
    }

    if (!appointment?.service?.name) {
      throw new Error('Payload invalido: falta servicio');
    }

    const fechaTurno = new Date(appointment.bookingStart);
    const fechaFin = new Date(appointment.bookingEnd);
    const horaInicio = format(fechaTurno, 'HH:mm');
    const horaFin = format(fechaFin, 'HH:mm');
    const duracionMinutos = Math.round((fechaFin.getTime() - fechaTurno.getTime()) / 60000);

    const nuevoTurno = this.turnoRepo.create({
      ameliaAppointmentId: appointment.id,
      ameliaBookingId: booking.id,
      ameliaCustomerId: booking.customerId,
      nombreCompleto,
      primerNombre: booking.customer?.firstName,
      apellido: booking.customer?.lastName,
      telefono: phoneResult.normalized,
      telefonoOriginal,
      email: booking.customer?.email,
      dni,
      ciudad,
      tipoLicencia: appointment.service.name,
      descripcionServicio: appointment.service.description,
      fechaTurno,
      horaInicio,
      horaFin,
      duracionMinutos,
      ubicacion: appointment.location?.name || 'Municipalidad de Ceres',
      estado: this.mapearEstadoAmelia(appointment.status),
      ameliaStatus: appointment.status,
      notificacionEnviada: false,
      intentosNotificacion: 0,
      cancelUrl: booking.cancelUrl,
      customerPanelUrl: booking.customerPanelUrl,
      providerName: appointment.provider
        ? `${appointment.provider.firstName} ${appointment.provider.lastName}`
        : undefined,
      providerEmail: appointment.provider?.email,
      metadata: sanitizedPayload,
    });

    const turnoGuardado = await this.turnoRepo.save(nuevoTurno);

    await this.logActivity({
      type: 'TURNO_LICENCIA',
      action: 'TURNO_CREADO',
      description: `Nuevo turno de licencia registrado - ${appointment.service.name}`,
      entityId: turnoGuardado.id,
      metadata: {
        ameliaBookingId: booking.id,
        telefono: phoneResult.normalized,
        fechaTurno: format(fechaTurno, 'dd/MM/yyyy HH:mm'),
        tipoLicencia: appointment.service.name,
      },
    });

    await this.enviarNotificacionTurno(turnoGuardado);

    return turnoGuardado;
  }

  async obtenerTurnosPorTelefono(telefono: string): Promise<AmeliaTurno[]> {
    const phoneResult = normalizeArgentinePhone(telefono, '3564');
    const telefonoNormalizado = phoneResult.isValid ? phoneResult.normalized : telefono;

    return this.turnoRepo.find({
      where: { telefono: telefonoNormalizado },
      order: { fechaTurno: 'DESC' },
    });
  }

  async buscarPorAmeliaBookingId(ameliaBookingId: number): Promise<AmeliaTurno | null> {
    return this.turnoRepo.findOne({ where: { ameliaBookingId } });
  }

  async obtenerTurnoPorId(id: number): Promise<AmeliaTurno | null> {
    return this.turnoRepo.findOne({ where: { id } });
  }

  async actualizarEstado(
    id: number,
    nuevoEstado: 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO' | 'COMPLETADO' | 'NO_ASISTIO',
    usuarioId?: number,
  ): Promise<AmeliaTurno> {
    const turno = await this.obtenerTurnoPorId(id);
    if (!turno) {
      throw new Error('Turno no encontrado');
    }

    const estadoAnterior = turno.estado;
    turno.estado = nuevoEstado;

    const turnoActualizado = await this.turnoRepo.save(turno);

    await this.logActivity({
      type: 'TURNO_LICENCIA',
      action: 'ESTADO_ACTUALIZADO',
      description: `Estado de turno actualizado: ${estadoAnterior} -> ${nuevoEstado}`,
      entityId: turno.id,
      userId: usuarioId,
      metadata: {
        estadoAnterior,
        estadoNuevo: nuevoEstado,
        ameliaBookingId: turno.ameliaBookingId,
      },
    });

    return turnoActualizado;
  }

  async reintentarNotificacionesFallidas(maxIntentos: number = 3): Promise<void> {
    const turnosSinNotificar = await this.turnoRepo
      .createQueryBuilder('turno')
      .where('turno.notificacion_enviada = false')
      .andWhere('turno.intentos_notificacion < :maxIntentos', { maxIntentos })
      .andWhere('turno.estado != :cancelado', { cancelado: 'CANCELADO' })
      .getMany();

    for (const turno of turnosSinNotificar) {
      await this.enviarNotificacionTurno(turno);
      await this.sleep(2000);
    }
  }

  private async actualizarTurno(
    turno: AmeliaTurno,
    appointment: AmeliaWebhookPayload['appointment'],
    metadata: any,
  ): Promise<AmeliaTurno> {
    const estadoAnterior = turno.estado;
    const nuevoEstado = this.mapearEstadoAmelia(appointment.status);

    turno.ameliaStatus = appointment.status;
    turno.estado = nuevoEstado;
    turno.metadata = metadata;

    const turnoActualizado = await this.turnoRepo.save(turno);

    if (estadoAnterior !== nuevoEstado) {
      await this.logActivity({
        type: 'TURNO_LICENCIA',
        action: 'ESTADO_CAMBIADO',
        description: `Turno ${turno.ameliaBookingId} cambio de estado: ${estadoAnterior} -> ${nuevoEstado}`,
        entityId: turno.id,
        metadata: {
          estadoAnterior,
          estadoNuevo: nuevoEstado,
          ameliaStatus: appointment.status,
        },
      });

      if (nuevoEstado === 'CANCELADO') {
        await this.enviarNotificacionCancelacion(turnoActualizado);
      }
    }

    return turnoActualizado;
  }

  private mapearEstadoAmelia(
    ameliaStatus: string,
  ): 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO' | 'COMPLETADO' | 'NO_ASISTIO' {
    switch (ameliaStatus.toLowerCase()) {
      case 'approved':
        return 'CONFIRMADO';
      case 'pending':
        return 'PENDIENTE';
      case 'canceled':
      case 'rejected':
        return 'CANCELADO';
      case 'completed':
        return 'COMPLETADO';
      case 'no-show':
        return 'NO_ASISTIO';
      default:
        return 'PENDIENTE';
    }
  }

  private async enviarNotificacionTurno(turno: AmeliaTurno): Promise<void> {
    try {
      if (!isValidArgentinePhone(turno.telefono)) {
        turno.notificacionError = `Telefono invalido: ${turno.telefono}`;
        turno.intentosNotificacion += 1;
        await this.turnoRepo.save(turno);
        return;
      }

      const fechaFormateada = format(turno.fechaTurno, "EEEE d 'de' MMMM", { locale: es });

      const components = [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: turno.nombreCompleto },
            { type: 'text', text: fechaFormateada },
            { type: 'text', text: turno.horaInicio },
            { type: 'text', text: turno.ubicacion || 'Municipalidad de Ceres' },
            { type: 'text', text: turno.tipoLicencia },
          ],
        },
      ];

      await this.enviarTemplate(turno.telefono, this.templateConfirmado, 'es_AR', components);

      turno.notificacionEnviada = true;
      turno.fechaNotificacion = new Date();
      turno.intentosNotificacion += 1;
      await this.turnoRepo.save(turno);
    } catch (error: any) {
      turno.notificacionError = error?.message || 'Error desconocido';
      turno.intentosNotificacion += 1;
      await this.turnoRepo.save(turno);
    }
  }

  private async enviarNotificacionCancelacion(turno: AmeliaTurno): Promise<void> {
    try {
      if (!isValidArgentinePhone(turno.telefono)) {
        return;
      }

      const fechaFormateada = format(turno.fechaTurno, "EEEE d 'de' MMMM", { locale: es });

      const components = [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: turno.nombreCompleto },
            { type: 'text', text: fechaFormateada },
            { type: 'text', text: turno.horaInicio },
          ],
        },
      ];

      await this.enviarTemplate(turno.telefono, this.templateCancelado, 'es_AR', components);
    } catch (error: any) {
      // swallow
    }
  }

  private async enviarTemplate(
    number: string,
    template: string,
    languageCode: string,
    components: Array<{ type: string; parameters: Array<{ type: string; text: string }> }>,
  ): Promise<void> {
    await axios.post(this.whatsappApiUrl, {
      number,
      template,
      languageCode,
      components,
    });
  }

  private async logActivity(params: {
    type: string;
    action: string;
    description: string;
    entityId?: number;
    userId?: number;
    metadata?: Record<string, any>;
  }) {
    const activity = this.activityRepo.create({
      type: params.type,
      action: params.action,
      description: params.description,
      entityId: params.entityId,
      userId: params.userId,
      metadata: params.metadata,
    });

    await this.activityRepo.save(activity);
  }

  private normalizePayload(rawPayload: any): AmeliaWebhookPayload {
    if (!rawPayload) {
      throw new Error('Payload invalido: el body esta vacio');
    }

    let appointment = rawPayload.appointment;
    if (!appointment && rawPayload.appointments && Array.isArray(rawPayload.appointments)) {
      appointment = rawPayload.appointments[0];
    }

    if (!appointment && rawPayload.id && rawPayload.bookings) {
      appointment = rawPayload;
    }

    if (!appointment) {
      throw new Error('Payload invalido: falta informacion del appointment');
    }

    let bookings = appointment.bookings || rawPayload.bookings;

    if (Array.isArray(bookings)) {
      const map: Record<string, any> = {};
      bookings.forEach((item: any, index: number) => {
        const key = item?.id ? String(item.id) : String(index);
        map[key] = item;
      });
      bookings = map;
    }

    if (!bookings || (typeof bookings === 'object' && Object.keys(bookings).length === 0)) {
      throw new Error('Payload invalido: falta informacion de bookings');
    }

    return {
      appointment: {
        ...appointment,
        bookings,
      },
      bookings,
    };
  }

  private sanitizePayload(payload: any): any {
    if (!payload || typeof payload !== 'object') return payload;
    const clone = { ...payload };
    if ('token' in clone) {
      delete clone.token;
    }
    return clone;
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
