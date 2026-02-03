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

  @Column({ name: 'valor_anterior', type: 'varchar', nullable: true })
  valorAnterior!: string | null;

  @Column({ name: 'valor_nuevo', type: 'varchar', nullable: true })
  valorNuevo!: string | null;

  @Column({ name: 'usuario_id', type: 'int', nullable: true })
  usuarioId!: number | null;

  @Column({ type: 'varchar', nullable: true })
  comentario!: string | null;
}
