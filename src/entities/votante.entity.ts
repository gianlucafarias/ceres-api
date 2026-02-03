import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'votante' })
export class Votante {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  mesa!: string;

  @Column()
  orden!: string;

  @Column()
  nombre!: string;

  @Column()
  direccion!: string;

  @Index()
  @Column()
  documento!: string;

  @Column()
  clase!: string;

  @Column()
  anioNacimiento!: string;

  @Column()
  provincia!: string;

  @Column()
  departamento!: string;

  @Column()
  localidad!: string;
}
