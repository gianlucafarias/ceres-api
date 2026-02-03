import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Contact } from './contact.entity';

@Entity({ name: 'preferencias_usuario' })
export class PreferenciasUsuario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'contact_id' })
  contactId!: number;

  @ManyToOne(() => Contact)
  @JoinColumn({ name: 'contact_id' })
  contact!: Contact;

  @Column({ default: false, name: 'notificar_humedo' })
  notificarHumedo!: boolean;

  @Column({ default: false, name: 'notificar_seco' })
  notificarSeco!: boolean;

  @Column({ default: false, name: 'notificar_patio' })
  notificarPatio!: boolean;

  @Column({ nullable: true, name: 'hora_notificacion' })
  horaNotificacion!: string | null;
}
