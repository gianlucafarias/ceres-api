import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'notificaciones' })
export class Notificaciones {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'usuario_id' })
  usuarioId!: number;

  @Column({ name: 'seccion_id', type: 'int', nullable: true })
  seccionId?: number | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha!: Date;

  @Column({ default: false })
  notificado!: boolean;
}
