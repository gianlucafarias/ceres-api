import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'qr_tracking' })
export class QrTracking {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ type: 'varchar', length: 32 })
  slug!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'target_url', type: 'text' })
  targetUrl!: string;

  @Column({ name: 'scan_count', type: 'integer', default: () => '0' })
  scanCount!: number;

  @Column({ name: 'last_scanned_at', type: 'timestamptz', nullable: true })
  lastScannedAt!: Date | null;

  @Column({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  createdAt!: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  updatedAt!: Date;
}
