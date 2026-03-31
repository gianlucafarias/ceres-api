import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'ops_event_log' })
export class OpsEventLog {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  source!: string;

  @Column({ type: 'varchar', length: 16 })
  kind!: string;

  @Column({ type: 'varchar', length: 120 })
  domain!: string;

  @Column({ name: 'event_name', type: 'varchar', length: 191 })
  eventName!: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 120, nullable: true })
  entityType!: string | null;

  @Column({ name: 'entity_id', type: 'varchar', length: 191, nullable: true })
  entityId!: string | null;

  @Column({ name: 'actor_type', type: 'varchar', length: 32 })
  actorType!: string;

  @Column({ name: 'actor_id', type: 'varchar', length: 191, nullable: true })
  actorId!: string | null;

  @Column({ name: 'actor_label', type: 'varchar', length: 191, nullable: true })
  actorLabel!: string | null;

  @Column({ name: 'actor_email', type: 'varchar', length: 191, nullable: true })
  actorEmail!: string | null;

  @Column({ name: 'actor_role', type: 'varchar', length: 120, nullable: true })
  actorRole!: string | null;

  @Column({ name: 'request_id', type: 'varchar', length: 191, nullable: true })
  requestId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  route!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  path!: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  method!: string | null;

  @Column({ type: 'varchar', length: 16 })
  status!: string;

  @Column({ name: 'duration_ms', type: 'integer', nullable: true })
  durationMs!: number | null;

  @Column({ type: 'varchar', length: 500 })
  summary!: string;

  @Column({ type: 'jsonb', nullable: true })
  changes!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt!: Date;

  @Column({
    name: 'ingested_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  ingestedAt!: Date;
}
