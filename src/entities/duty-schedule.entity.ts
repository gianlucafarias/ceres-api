import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Pharmacy } from './pharmacy.entity';

@Entity({ name: 'duty_schedule' })
export class DutySchedule {
  @PrimaryColumn({ type: 'date', name: 'date' })
  date!: string;

  @Column({ type: 'varchar', length: 50, name: 'pharmacy_code' })
  pharmacyCode!: string;

  @ManyToOne(() => Pharmacy, { eager: true })
  @JoinColumn({ name: 'pharmacy_code', referencedColumnName: 'code' })
  pharmacy!: Pharmacy;

  @Column({ type: 'int', name: 'schedule_year' })
  scheduleYear!: number;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'source' })
  source?: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
