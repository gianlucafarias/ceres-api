import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Contact } from './contact.entity';

@Entity({ name: 'history' })
@Index('idx_history_phone_created_at', ['phone', 'createdAt'])
@Index('idx_history_contact_id_created_at', ['contactId', 'createdAt'])
export class History {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  ref!: string;

  @Column()
  keyword!: string;

  @Column()
  answer!: string;

  @Column({ name: 'refserialize' })
  refSerialize!: string;

  @Column()
  phone!: string;

  @Column({ type: 'jsonb' })
  options!: Record<string, unknown>;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @Column({ name: 'updated_in', type: 'timestamp', nullable: true })
  updatedIn!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  conversation_id!: string | null;

  @Column({ name: 'contact_id', type: 'integer', nullable: true })
  contactId!: number | null;

  @ManyToOne(() => Contact, (contact) => contact.history, { nullable: true })
  @JoinColumn({ name: 'contact_id' })
  contact!: Contact;
}
