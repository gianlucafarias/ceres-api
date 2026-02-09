import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'conversaciones' })
@Index('idx_conversaciones_contact_id_fecha_hora', ['contact_id', 'fecha_hora'])
export class Converstation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp' })
  fecha_hora!: Date;

  @Column()
  nombre!: string;

  @Column()
  telefono!: string;

  @Column()
  duracion_minutos!: string;

  @Column({ name: 'conversation_id' })
  conversation_id!: string;

  @Column()
  contact_id!: number;

  @Column()
  razon_fin!: string;

  @Column()
  ultimo_flujo!: string;

  @Column()
  fecha_inicio!: Date;
}
