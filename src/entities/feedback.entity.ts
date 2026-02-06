import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Contact } from './contact.entity';

@Entity({ name: 'feedback' })
export class Feedback {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Contact, (contact) => contact.history)
  @JoinColumn({ name: 'contact_id' })
  contact_id!: Contact;

  @Column()
  nombre!: string;

  @Column()
  calificacion!: string;

  @Column()
  comentario!: string;

  @Column()
  timestamp!: Date;

  @Column()
  conversation_id!: string;
}
