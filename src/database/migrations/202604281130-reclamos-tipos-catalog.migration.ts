import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReclamosTiposCatalog1777375800000 implements MigrationInterface {
  name = 'ReclamosTiposCatalog1777375800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tipos_reclamo (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_tipos_reclamo_nombre UNIQUE (nombre)
      )
    `);
  }

  public async down(): Promise<void> {
    // Intencionalmente vacio para evitar drops destructivos en produccion.
  }
}
