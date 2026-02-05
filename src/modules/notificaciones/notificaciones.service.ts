import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../../entities/contact.entity';
import { Notificaciones } from '../../entities/notificaciones.entity';
import { PreferenciasUsuario } from '../../entities/preferencias-usuario.entity';
import { WhatsappTemplateService } from '../../shared/whatsapp/whatsapp-template.service';
import { WhatsappComponent } from '../../shared/whatsapp/whatsapp.types';
import { ActualizarPreferenciasDto, ActualizarSeccionDto, EnviarTemplateDto } from './dto/notificaciones.dto';

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    @InjectRepository(PreferenciasUsuario)
    private readonly prefRepo: Repository<PreferenciasUsuario>,
    @InjectRepository(Notificaciones)
    private readonly notifRepo: Repository<Notificaciones>,
    private readonly whatsapp: WhatsappTemplateService,
  ) {}

  async actualizarPreferencias(dto: ActualizarPreferenciasDto) {
    const contacto = await this.contactRepo.findOne({ where: { id: dto.contact_id } });
    if (!contacto) {
      throw new NotFoundException('Contacto no encontrado');
    }

    let preferencias = await this.prefRepo.findOne({ where: { contactId: dto.contact_id } });

    if (!preferencias) {
      preferencias = this.prefRepo.create({
        contactId: dto.contact_id,
        notificarHumedo: dto.notificar_humedo ?? false,
        notificarSeco: dto.notificar_seco ?? false,
        notificarPatio: dto.notificar_patio ?? false,
        horaNotificacion: dto.hora_notificacion ?? '19:00',
      });
    } else {
      if (dto.notificar_humedo !== undefined) {
        preferencias.notificarHumedo = dto.notificar_humedo;
      }
      if (dto.notificar_seco !== undefined) {
        preferencias.notificarSeco = dto.notificar_seco;
      }
      if (dto.notificar_patio !== undefined) {
        preferencias.notificarPatio = dto.notificar_patio;
      }
      if (dto.hora_notificacion) {
        preferencias.horaNotificacion = dto.hora_notificacion;
      }
    }

    return this.prefRepo.save(preferencias);
  }

  async obtenerPreferencias(contactId: number) {
    return this.prefRepo.findOne({ where: { contactId } });
  }

  async actualizarSeccion(dto: ActualizarSeccionDto) {
    const contacto = await this.contactRepo.findOne({ where: { id: dto.contact_id } });
    if (!contacto) {
      throw new NotFoundException('Contacto no encontrado');
    }

    const notificacion = this.notifRepo.create({
      usuarioId: contacto.id,
      seccionId: dto.seccion_id,
      fecha: new Date(),
      notificado: false,
    });

    return this.notifRepo.save(notificacion);
  }

  async procesarNotificacionesDiarias(horaEnvio: string): Promise<void> {
    const hoy = new Date();
    const diaSemana = hoy.getDay();

    if (diaSemana === 0) return;

    const preferencias = await this.prefRepo.find({ relations: ['contact'] });

    for (const pref of preferencias) {
      const contacto = pref.contact;
      if (!contacto || !contacto.phone) continue;

      const usuarioId = contacto.id;

      if (pref.notificarHumedo && this.esResiduoHumedo(diaSemana)) {
        await this.enviarNotificacion(usuarioId, contacto.phone, 'humedo', horaEnvio);
        await this.registrarNotificacion(usuarioId);
      }

      if (pref.notificarSeco && this.esResiduoSeco(diaSemana)) {
        await this.enviarNotificacion(usuarioId, contacto.phone, 'seco', horaEnvio);
        await this.registrarNotificacion(usuarioId);
      }

      const seccionId = await this.obtenerSeccionDeUsuario(usuarioId);
      if (pref.notificarPatio && seccionId && this.esResiduoPatio(hoy, seccionId)) {
        await this.enviarNotificacion(usuarioId, contacto.phone, 'patio', horaEnvio, `Seccion ${seccionId}`);
        await this.registrarNotificacion(usuarioId);
      }
    }
  }

  private async registrarNotificacion(usuarioId: number) {
    const notificacion = this.notifRepo.create({
      usuarioId,
      fecha: new Date(),
      notificado: true,
    });
    await this.notifRepo.save(notificacion);
  }

  private esResiduoHumedo(diaSemana: number): boolean {
    return [1, 3, 4, 6].includes(diaSemana);
  }

  private esResiduoSeco(diaSemana: number): boolean {
    return [2, 5].includes(diaSemana);
  }

  private esResiduoPatio(fecha: Date, seccionId: number): boolean {
    const diaSemana = fecha.getDay();
    if (![1, 5].includes(diaSemana)) return false;

    const primerDiaMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    let semanaActual = 0;
    const fechaActual = new Date(primerDiaMes);

    while (fechaActual <= fecha) {
      if (fechaActual.getDay() !== 0) {
        if (fechaActual.getDay() === 1) {
          semanaActual += 1;
        }
      }
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    return semanaActual === seccionId;
  }

  private async obtenerSeccionDeUsuario(usuarioId: number): Promise<number | null> {
    const notificacion = await this.notifRepo.findOne({
      where: { usuarioId },
      order: { id: 'DESC' },
    });

    return notificacion?.seccionId ?? null;
  }

  private async enviarNotificacion(
    usuarioId: number,
    telefono: string,
    tipoResiduo: 'humedo' | 'seco' | 'patio',
    horaEnvio: string,
    seccion?: string,
  ): Promise<void> {
    let templateName = '';
    switch (tipoResiduo) {
      case 'humedo':
        templateName = 'r_humedos';
        break;
      case 'seco':
        templateName = 'r_secos';
        break;
      case 'patio':
        templateName = 'residuos_patio';
        break;
    }

    const parameters: Array<{ type: 'text'; text: string }> = [];
    if (tipoResiduo === 'patio' && seccion) {
      parameters.push({ type: 'text', text: seccion });
    }

    try {
      await this.enviarTemplate({
        number: telefono,
        template: templateName,
        languageCode: 'es_AR',
        components: [
          {
            type: 'BODY',
            parameters,
          },
        ],
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[notificaciones] error enviando whatsapp', {
        usuarioId,
        telefono,
        message,
      });
    }
  }

  async enviarTemplate(dto: EnviarTemplateDto): Promise<void> {
    const components: WhatsappComponent[] | undefined = dto.components?.map((component) => ({
      type: component.type,
      parameters: component.parameters?.map((param) => ({ type: 'text', text: param.text })) ?? [],
    }));

    const payload = {
      number: dto.number,
      template: dto.template,
      languageCode: dto.languageCode ?? 'es_AR',
      components,
    };

    await this.whatsapp.sendTemplate(payload);
  }
}
