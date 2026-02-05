import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'amelia_turnos' })
@Index(['telefono'])
@Index(['ameliaBookingId'], { unique: true })
@Index(['fechaTurno'])
@Index(['estado'])
export class AmeliaTurno {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'amelia_appointment_id', type: 'integer' })
  ameliaAppointmentId!: number;

  @Column({ name: 'amelia_booking_id', type: 'integer', unique: true })
  ameliaBookingId!: number;

  @Column({ name: 'amelia_customer_id', type: 'integer' })
  ameliaCustomerId!: number;

  @Column({ name: 'nombre_completo', type: 'varchar', length: 255 })
  nombreCompleto!: string;

  @Column({
    name: 'primer_nombre',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  primerNombre?: string | null;

  @Column({ name: 'apellido', type: 'varchar', length: 100, nullable: true })
  apellido?: string | null;

  @Column({ type: 'varchar', length: 20 })
  telefono!: string;

  @Column({ name: 'telefono_original', type: 'varchar', length: 50 })
  telefonoOriginal!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  dni?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ciudad?: string | null;

  @Column({ name: 'tipo_licencia', type: 'varchar', length: 255 })
  tipoLicencia!: string;

  @Column({ name: 'descripcion_servicio', type: 'text', nullable: true })
  descripcionServicio?: string | null;

  @Column({ name: 'fecha_turno', type: 'timestamp' })
  fechaTurno!: Date;

  @Column({ name: 'hora_inicio', type: 'varchar', length: 10 })
  horaInicio!: string;

  @Column({ name: 'hora_fin', type: 'varchar', length: 10 })
  horaFin!: string;

  @Column({ name: 'duracion_minutos', type: 'integer', default: 30 })
  duracionMinutos!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ubicacion?: string | null;

  @Column({ type: 'varchar', length: 20, default: 'PENDIENTE' })
  estado!:
    | 'PENDIENTE'
    | 'CONFIRMADO'
    | 'CANCELADO'
    | 'COMPLETADO'
    | 'NO_ASISTIO';

  @Column({ name: 'amelia_status', type: 'varchar', length: 50 })
  ameliaStatus!: string;

  @Column({ name: 'notificacion_enviada', type: 'boolean', default: false })
  notificacionEnviada!: boolean;

  @Column({ name: 'fecha_notificacion', type: 'timestamp', nullable: true })
  fechaNotificacion?: Date | null;

  @Column({ name: 'notificacion_error', type: 'text', nullable: true })
  notificacionError?: string | null;

  @Column({ name: 'intentos_notificacion', type: 'integer', default: 0 })
  intentosNotificacion!: number;

  @Column({ name: 'cancel_url', type: 'text', nullable: true })
  cancelUrl?: string | null;

  @Column({ name: 'customer_panel_url', type: 'text', nullable: true })
  customerPanelUrl?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({
    name: 'provider_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  providerName?: string | null;

  @Column({
    name: 'provider_email',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  providerEmail?: string | null;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion!: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion!: Date;
}
