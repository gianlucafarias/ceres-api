import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'encuesta_presupuesto' })
export class EncuestaPresupuesto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ length: 20 })
  dni!: string;

  @Column({ length: 100 })
  barrio!: string;

  @Column('jsonb')
  obrasUrgentes!: string[];

  @Column({ type: 'varchar', nullable: true })
  obrasUrgentesOtro!: string | null;

  @Column('jsonb')
  serviciosMejorar!: string[];

  @Column({ type: 'varchar', nullable: true })
  serviciosMejorarOtro!: string | null;

  @Column({ type: 'text', nullable: true })
  espacioMejorar!: string | null;

  @Column({ type: 'text', nullable: true })
  propuesta!: string | null;

  @Column({ default: false })
  quiereContacto!: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  nombreCompleto!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  email!: string | null;

  @CreateDateColumn({ name: 'fechaCreacion' })
  fechaCreacion!: Date;

  @UpdateDateColumn({ name: 'fechaActualizacion' })
  fechaActualizacion!: Date;

  @Column({ default: 'completada' })
  estado!: string;
}
