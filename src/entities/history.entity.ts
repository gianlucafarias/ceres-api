import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Contact } from './contact.entity';

@Entity({ name: 'history' })
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

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ name: 'updated_in', type: 'timestamp', nullable: true })
  updatedIn!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  conversation_id!: string | null;

  @ManyToOne(() => Contact, (contact) => contact.history)
  @JoinColumn({ name: 'contact_id' })
  contact!: Contact;
}
