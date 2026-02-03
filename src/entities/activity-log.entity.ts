import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'activity_log' })
export class ActivityLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  type!: string;

  @Column({ type: 'varchar', length: 50 })
  action!: string;

  @Column({ type: 'varchar', length: 255 })
  description!: string;

  @Column({ name: 'entity_id', type: 'int', nullable: true })
  entityId?: number | null;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId?: number | null;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
