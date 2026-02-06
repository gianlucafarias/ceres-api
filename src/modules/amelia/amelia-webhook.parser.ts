import { Injectable } from '@nestjs/common';

export interface AmeliaCustomField {
  label: string;
  type: string;
  value: string;
}

export interface AmeliaCustomer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface AmeliaBookingInfoArray {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface AmeliaBooking {
  id: number;
  customerId: number;
  status?: string;
  cancelUrl?: string;
  customerPanelUrl?: string;
  infoArray?: AmeliaBookingInfoArray;
  customFields?: Record<string, AmeliaCustomField>;
  customer: AmeliaCustomer;
}

export interface AmeliaServiceInfo {
  id: number;
  name: string;
  description?: string;
}

export interface AmeliaProviderInfo {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface AmeliaLocationInfo {
  name: string;
  address?: string;
}

export interface AmeliaAppointment {
  id: number;
  status: string;
  serviceId?: number;
  bookingStart: string;
  bookingEnd: string;
  service: AmeliaServiceInfo;
  provider?: AmeliaProviderInfo;
  location?: AmeliaLocationInfo;
}

export interface NormalizedAmeliaPayload {
  appointment: AmeliaAppointment;
  bookings: Record<string, AmeliaBooking>;
  raw: Record<string, unknown>;
}

@Injectable()
export class AmeliaWebhookParser {
  normalize(rawPayload: unknown): NormalizedAmeliaPayload {
    const payload = this.ensureRecord(rawPayload, 'payload');

    const appointmentRaw = this.resolveAppointment(payload);
    const appointment = this.parseAppointment(appointmentRaw);

    const bookingsRaw = this.resolveBookings(appointmentRaw, payload);
    const bookings = this.parseBookings(bookingsRaw);

    if (Object.keys(bookings).length === 0) {
      throw new Error('Payload invalido: falta informacion de bookings');
    }

    return {
      appointment,
      bookings,
      raw: this.stripToken(payload),
    };
  }

  private resolveAppointment(
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    const directAppointment = payload.appointment;
    if (this.isRecord(directAppointment)) {
      return directAppointment;
    }

    const appointmentsRaw = payload.appointments;
    if (
      Array.isArray(appointmentsRaw) &&
      appointmentsRaw.length > 0 &&
      this.isRecord(appointmentsRaw[0])
    ) {
      return appointmentsRaw[0];
    }

    if (this.isRecord(payload) && payload.id && payload.bookings) {
      return payload;
    }

    throw new Error('Payload invalido: falta informacion del appointment');
  }

  private resolveBookings(
    appointmentRaw: Record<string, unknown>,
    payload: Record<string, unknown>,
  ): unknown {
    if (appointmentRaw.bookings) {
      return appointmentRaw.bookings;
    }

    return payload.bookings;
  }

  private parseAppointment(raw: Record<string, unknown>): AmeliaAppointment {
    const id = this.getNumber(raw, 'id', 'appointment.id');
    const status = this.getString(raw, 'status', 'appointment.status');
    const bookingStart = this.getString(
      raw,
      'bookingStart',
      'appointment.bookingStart',
    );
    const bookingEnd = this.getString(
      raw,
      'bookingEnd',
      'appointment.bookingEnd',
    );

    const serviceRaw = this.ensureRecord(raw.service, 'appointment.service');
    const service: AmeliaServiceInfo = {
      id: this.getNumber(serviceRaw, 'id', 'appointment.service.id'),
      name: this.getString(serviceRaw, 'name', 'appointment.service.name'),
      description: this.getOptionalString(serviceRaw, 'description'),
    };

    const provider = this.parseProvider(raw.provider);
    const location = this.parseLocation(raw.location);

    const serviceId = this.getOptionalNumber(raw, 'serviceId');

    return {
      id,
      status,
      serviceId,
      bookingStart,
      bookingEnd,
      service,
      provider,
      location,
    };
  }

  private parseProvider(raw: unknown): AmeliaProviderInfo | undefined {
    if (!this.isRecord(raw)) return undefined;
    return {
      id: this.getNumber(raw, 'id', 'provider.id'),
      firstName: this.getString(raw, 'firstName', 'provider.firstName'),
      lastName: this.getString(raw, 'lastName', 'provider.lastName'),
      email: this.getOptionalString(raw, 'email'),
    };
  }

  private parseLocation(raw: unknown): AmeliaLocationInfo | undefined {
    if (!this.isRecord(raw)) return undefined;
    return {
      name: this.getString(raw, 'name', 'location.name'),
      address: this.getOptionalString(raw, 'address'),
    };
  }

  private parseBookings(raw: unknown): Record<string, AmeliaBooking> {
    if (Array.isArray(raw)) {
      return raw.reduce<Record<string, AmeliaBooking>>((acc, item, index) => {
        if (!this.isRecord(item)) return acc;
        const booking = this.parseBooking(item);
        const key = booking.id ? String(booking.id) : String(index);
        acc[key] = booking;
        return acc;
      }, {});
    }

    if (this.isRecord(raw)) {
      const result: Record<string, AmeliaBooking> = {};
      for (const [key, value] of Object.entries(raw)) {
        if (!this.isRecord(value)) continue;
        result[key] = this.parseBooking(value);
      }
      return result;
    }

    return {};
  }

  private parseBooking(raw: Record<string, unknown>): AmeliaBooking {
    const id = this.getNumber(raw, 'id', 'booking.id');
    const customerId = this.getNumber(raw, 'customerId', 'booking.customerId');
    const customerRaw = this.ensureRecord(raw.customer, 'booking.customer');

    const customer: AmeliaCustomer = {
      id: this.getNumber(customerRaw, 'id', 'booking.customer.id'),
      firstName: this.getString(
        customerRaw,
        'firstName',
        'booking.customer.firstName',
      ),
      lastName: this.getString(
        customerRaw,
        'lastName',
        'booking.customer.lastName',
      ),
      email: this.getString(customerRaw, 'email', 'booking.customer.email'),
      phone: this.getString(customerRaw, 'phone', 'booking.customer.phone'),
    };

    return {
      id,
      customerId,
      status: this.getOptionalString(raw, 'status'),
      cancelUrl: this.getOptionalString(raw, 'cancelUrl'),
      customerPanelUrl: this.getOptionalString(raw, 'customerPanelUrl'),
      infoArray: this.parseInfoArray(raw.infoArray),
      customFields: this.parseCustomFields(raw.customFields),
      customer,
    };
  }

  private parseInfoArray(raw: unknown): AmeliaBookingInfoArray | undefined {
    if (!this.isRecord(raw)) return undefined;
    return {
      firstName: this.getOptionalString(raw, 'firstName'),
      lastName: this.getOptionalString(raw, 'lastName'),
      phone: this.getOptionalString(raw, 'phone'),
    };
  }

  private parseCustomFields(
    raw: unknown,
  ): Record<string, AmeliaCustomField> | undefined {
    if (!this.isRecord(raw)) return undefined;
    const result: Record<string, AmeliaCustomField> = {};

    for (const [key, value] of Object.entries(raw)) {
      if (!this.isRecord(value)) continue;
      const label = this.getOptionalString(value, 'label');
      const type = this.getOptionalString(value, 'type');
      const val = this.getOptionalString(value, 'value');
      if (label && type && val) {
        result[key] = { label, type, value: val };
      }
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }

  private stripToken(
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    const clone: Record<string, unknown> = { ...payload };
    if ('token' in clone) {
      delete clone.token;
    }
    return clone;
  }

  private ensureRecord(value: unknown, label: string): Record<string, unknown> {
    if (!this.isRecord(value)) {
      throw new Error(`Payload invalido: falta ${label}`);
    }
    return value;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private getString(
    record: Record<string, unknown>,
    key: string,
    label: string,
  ): string {
    const value = record[key];
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`Payload invalido: ${label}`);
    }
    return value;
  }

  private getOptionalString(
    record: Record<string, unknown>,
    key: string,
  ): string | undefined {
    const value = record[key];
    return typeof value === 'string' && value.trim() !== '' ? value : undefined;
  }

  private getNumber(
    record: Record<string, unknown>,
    key: string,
    label: string,
  ): number {
    const value = record[key];
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new Error(`Payload invalido: ${label}`);
    }
    return value;
  }

  private getOptionalNumber(
    record: Record<string, unknown>,
    key: string,
  ): number | undefined {
    const value = record[key];
    return typeof value === 'number' && !Number.isNaN(value)
      ? value
      : undefined;
  }
}
