import { MigrationInterface, QueryRunner } from 'typeorm';

export class QrTrackingReadableSlugs1776164400000 implements MigrationInterface {
  name = 'QrTrackingReadableSlugs1776164400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE qr_tracking
      ALTER COLUMN slug TYPE varchar(160)
    `);
  }

  public async down(): Promise<void> {
    // Intencionalmente vacio para evitar cambios destructivos en produccion.
  }
}
