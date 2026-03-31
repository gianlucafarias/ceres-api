import { MigrationInterface, QueryRunner } from 'typeorm';

export class CentralOpsEvents1774897200000 implements MigrationInterface {
  name = 'CentralOpsEvents1774897200000';
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ops_event_log (
        id uuid PRIMARY KEY,
        source varchar(64) NOT NULL,
        kind varchar(16) NOT NULL,
        domain varchar(120) NOT NULL,
        event_name varchar(191) NOT NULL,
        entity_type varchar(120),
        entity_id varchar(191),
        actor_type varchar(32) NOT NULL,
        actor_id varchar(191),
        actor_label varchar(191),
        actor_email varchar(191),
        actor_role varchar(120),
        request_id varchar(191),
        route varchar(255),
        path varchar(255),
        method varchar(16),
        status varchar(16) NOT NULL,
        duration_ms integer,
        summary varchar(500) NOT NULL,
        changes jsonb,
        metadata jsonb,
        occurred_at timestamptz NOT NULL,
        ingested_at timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ops_event_log_source_occurred_at
      ON ops_event_log (source, occurred_at DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ops_event_log_request_id
      ON ops_event_log (request_id)
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ops_event_log_domain_occurred_at
      ON ops_event_log (domain, occurred_at DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ops_event_log_kind_status_occurred_at
      ON ops_event_log (kind, status, occurred_at DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ops_event_log_entity
      ON ops_event_log (entity_type, entity_id)
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ops_event_log_actor_id
      ON ops_event_log (actor_id)
    `);
  }

  public async down(): Promise<void> {
    // Intencionalmente vacio para evitar drops destructivos en produccion.
  }
}
