import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'reclamos' })
export class Reclamo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  fecha!: Date;

  @Column()
  nombre!: string;

  @Column()
  reclamo!: string;

  @Column()
  ubicacion!: string;

  @Column()
  barrio!: string;

  @Column()
  telefono!: string;

  @Column()
  estado!: string;

  @Column()
  detalle!: string;

  @Column()
  prioridad!: string;

  @Column({ type: 'numeric', nullable: true })
  latitud?: number | null;

  @Column({ type: 'numeric', nullable: true })
  longitud?: number | null;

  @Column({ type: 'int', nullable: true })
  cuadrillaid!: number | null;
}
