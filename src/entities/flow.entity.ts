import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'visitas_flujo' })
export class Flow {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre_flujo!: string;

  @Column()
  contador!: number;
}
