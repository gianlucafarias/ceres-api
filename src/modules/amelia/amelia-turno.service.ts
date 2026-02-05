import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { format } from 'date-fns';
import { Repository } from 'typeorm';
import { AmeliaTurno } from '../../entities/amelia-turno.entity';
import { isValidArgentinePhone, normalizeArgentinePhone } from './phone-normalizer';
import { AmeliaCustomField, NormalizedAmeliaPayload } from './amelia-webhook.parser';

export type EstadoTurno = 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO' | 'COMPLETADO' | 'NO_ASISTIO';

export interface UpsertTurnoResult {
  turno: AmeliaTurno;
  wasCreated: boolean;
  estadoAnterior?: EstadoTurno;
  estadoNuevo?: EstadoTurno;
}

@Injectable()
export class AmeliaTurnoService {
  constructor(
    @InjectRepository(AmeliaTurno)
    private readonly turnoRepo: Repository<AmeliaTurno>,
  ) {}

  async upsertFromWebhook(payload: NormalizedAmeliaPayload): Promise<UpsertTurnoResult> {
    const booking = this.getFirstBooking(payload);
    const existente = await this.buscarPorAmeliaBookingId(booking.id);

    if (existente) {
      return this.updateFromWebhook(existente, payload);
    }

    const nuevoTurno = this.buildTurno(payload);
    const saved = await this.turnoRepo.save(nuevoTurno);
    return { turno: saved, wasCreated: true };
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
    nuevoEstado: EstadoTurno,
  ): Promise<{ turno: AmeliaTurno; estadoAnterior: EstadoTurno } | null> {
    const turno = await this.obtenerTurnoPorId(id);
    if (!turno) return null;

    const estadoAnterior = turno.estado;
    turno.estado = nuevoEstado;

    const turnoActualizado = await this.turnoRepo.save(turno);
    return { turno: turnoActualizado, estadoAnterior };
  }

  async marcarNotificacionEnviada(turno: AmeliaTurno): Promise<void> {
    turno.notificacionEnviada = true;
    turno.fechaNotificacion = new Date();
    turno.intentosNotificacion += 1;
    await this.turnoRepo.save(turno);
  }

  async registrarErrorNotificacion(turno: AmeliaTurno, mensaje: string): Promise<void> {
    turno.notificacionError = mensaje;
    turno.intentosNotificacion += 1;
    await this.turnoRepo.save(turno);
  }

  async listarSinNotificar(maxIntentos: number): Promise<AmeliaTurno[]> {
    return this.turnoRepo
      .createQueryBuilder('turno')
      .where('turno.notificacion_enviada = false')
      .andWhere('turno.intentos_notificacion < :maxIntentos', { maxIntentos })
      .andWhere('turno.estado != :cancelado', { cancelado: 'CANCELADO' })
      .getMany();
  }

  private async updateFromWebhook(
    turno: AmeliaTurno,
    payload: NormalizedAmeliaPayload,
  ): Promise<UpsertTurnoResult> {
    const estadoAnterior = turno.estado;
    const estadoNuevo = this.mapearEstadoAmelia(payload.appointment.status);

    turno.ameliaStatus = payload.appointment.status;
    turno.estado = estadoNuevo;
    turno.metadata = payload.raw;

    const turnoActualizado = await this.turnoRepo.save(turno);

    return {
      turno: turnoActualizado,
      wasCreated: false,
      estadoAnterior,
      estadoNuevo,
    };
  }

  private buildTurno(payload: NormalizedAmeliaPayload): AmeliaTurno {
    const booking = this.getFirstBooking(payload);
    const appointment = payload.appointment;

    const telefonoOriginal = booking.customer.phone || booking.infoArray?.phone || '';
    const phoneResult = normalizeArgentinePhone(telefonoOriginal, '3564');

    const nombreCompleto = this.getNombreCompleto(booking);
    const { dni, ciudad } = this.extractCustomFields(booking.customFields);

    const fechaTurno = new Date(appointment.bookingStart);
    const fechaFin = new Date(appointment.bookingEnd);
    const horaInicio = format(fechaTurno, 'HH:mm');
    const horaFin = format(fechaFin, 'HH:mm');
    const duracionMinutos = Math.round((fechaFin.getTime() - fechaTurno.getTime()) / 60000);

    return this.turnoRepo.create({
      ameliaAppointmentId: appointment.id,
      ameliaBookingId: booking.id,
      ameliaCustomerId: booking.customerId,
      nombreCompleto,
      primerNombre: booking.customer.firstName,
      apellido: booking.customer.lastName,
      telefono: phoneResult.normalized,
      telefonoOriginal,
      email: booking.customer.email,
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
      metadata: payload.raw,
    });
  }

  private getFirstBooking(payload: NormalizedAmeliaPayload) {
    const bookingKey = Object.keys(payload.bookings)[0];
    const booking = payload.bookings[bookingKey];

    if (!booking) {
      throw new Error('No se encontro informacion de booking en el payload');
    }

    return booking;
  }

  private extractCustomFields(customFields?: Record<string, AmeliaCustomField>) {
    let dni: string | undefined;
    let ciudad: string | undefined;

    if (!customFields) return { dni, ciudad };

    for (const field of Object.values(customFields)) {
      if (field.label.toLowerCase().includes('dni')) {
        dni = field.value;
      }
      if (field.label.toLowerCase().includes('ciudad')) {
        ciudad = field.value;
      }
    }

    return { dni, ciudad };
  }

  private getNombreCompleto(booking: NormalizedAmeliaPayload['bookings'][string]): string {
    let nombreCompleto = `${booking.customer.firstName} ${booking.customer.lastName}`.trim();
    if (booking.infoArray?.firstName) {
      nombreCompleto = `${booking.infoArray.firstName} ${booking.infoArray.lastName || ''}`.trim();
    }
    return nombreCompleto;
  }

  mapearEstadoAmelia(ameliaStatus: string): EstadoTurno {
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

  isTelefonoValido(telefono: string): boolean {
    return isValidArgentinePhone(telefono);
  }
}
