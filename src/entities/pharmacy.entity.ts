import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'pharmacies' })
export class Pharmacy {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 200 })
  address!: string;

  @Column({ type: 'varchar', length: 50 })
  phone!: string;

  @Column({ type: 'double precision', nullable: true })
  lat?: number | null;

  @Column({ type: 'double precision', nullable: true })
  lng?: number | null;

  @Column({ type: 'text', nullable: true, name: 'google_maps_address' })
  googleMapsAddress?: string | null;
}
