import { MigrationInterface, QueryRunner } from 'typeorm';

export class DashboardIndexes1770641860438 implements MigrationInterface {
  name = 'DashboardIndexes1770641860438';
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversaciones_contact_id_fecha_hora
      ON conversaciones (contact_id, fecha_hora)
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_history_phone_created_at
      ON history (phone, created_at)
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_history_contact_id_created_at
      ON history (contact_id, created_at)
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contact_last_interaction
      ON contact (last_interaction)
    `);
  }

  public async down(): Promise<void> {
    // Intencionalmente vacio: no hacemos DROP de indices en produccion.
  }
}
