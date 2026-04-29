import { prepareEmailTemplate } from './ops-email.templates';

describe('prepareEmailTemplate', () => {
  it('renderiza aprobacion parcial cuando faltan antecedentes', () => {
    const template = prepareEmailTemplate('services.professional_approved', {
      recipient: 'pro@test.com',
      entityId: 'pro-1',
      payload: {
        firstName: 'Ana',
        loginUrl: 'https://plataforma.ceres.gob.ar',
        documentsUrl: 'https://plataforma.ceres.gob.ar/dashboard',
        pendingCriminalRecord: true,
      },
    });

    expect(template.subject).toContain('falta antecedentes penales');
    expect(template.html).toContain('Cargar antecedentes penales');
    expect(template.text).toContain('tilde azul');
  });

  it('mantiene aprobacion completa cuando no hay pendientes', () => {
    const template = prepareEmailTemplate('services.professional_approved', {
      recipient: 'pro@test.com',
      entityId: 'pro-1',
      payload: {
        firstName: 'Ana',
        loginUrl: 'https://plataforma.ceres.gob.ar',
      },
    });

    expect(template.subject).toBe('Tu perfil fue aprobado - Ceres en Red');
    expect(template.html).toContain('Ingresar a mi panel');
  });
});
