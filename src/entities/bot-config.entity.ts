import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'bot_config' })
export class BotConfig {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  clave!: string;

  @Column()
  valor!: string;

  @Column()
  activo!: boolean;

  @Column()
  fecha_actualizacion!: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_expiracion?: Date | null;
}
