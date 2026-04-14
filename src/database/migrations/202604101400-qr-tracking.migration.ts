import { MigrationInterface, QueryRunner } from 'typeorm';

export class QrTracking1775829600000 implements MigrationInterface {
  name = 'QrTracking1775829600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS qr_tracking (
        id uuid PRIMARY KEY,
        slug varchar(32) NOT NULL,
        name varchar(120) NOT NULL,
        target_url text NOT NULL,
        scan_count integer NOT NULL DEFAULT 0,
        last_scanned_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_tracking_slug
      ON qr_tracking (slug)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_qr_tracking_created_at
      ON qr_tracking (created_at DESC)
    `);
  }

  public async down(): Promise<void> {
    // Intencionalmente vacio para evitar drops destructivos en produccion.
  }
}
