import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { History } from './history.entity';

@Entity({ name: 'contact' })
export class Contact {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  phone!: string;

  @Column({ type: 'varchar', nullable: true })
  contact_name!: string | null;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @Column({ name: 'updated_in', type: 'timestamp', nullable: true })
  updatedIn!: Date | null;

  @Column({ name: 'last_interaction', type: 'timestamp', nullable: true })
  lastInteraction!: Date | null;

  @Column({ type: 'jsonb' })
  values!: Record<string, any>;

  @OneToMany(() => History, (history) => history.contact)
  history!: History[];
}
