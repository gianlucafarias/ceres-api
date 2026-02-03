import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Reclamo } from './reclamo.entity';

@Entity({ name: 'reclamo_historial' })
export class ReclamoHistorial {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'reclamo_id' })
  reclamoId!: number;

  @ManyToOne(() => Reclamo)
  @JoinColumn({ name: 'reclamo_id' })
  reclamo!: Reclamo;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha!: Date;

  @Column()
  tipo!: string;

  @Column({ name: 'valor_anterior', nullable: true })
  valorAnterior!: string | null;

  @Column({ name: 'valor_nuevo', nullable: true })
  valorNuevo!: string | null;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId!: number | null;

  @Column({ nullable: true })
  comentario!: string | null;
}
