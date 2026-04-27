import { EmailTemplateKey } from './observability.constants';
import { PreparedEmailTemplate } from './ops-email.types';

type TemplateInput = {
  entityId?: string | null;
  recipient: string;
  payload: Record<string, unknown>;
};

export function prepareEmailTemplate(
  templateKey: EmailTemplateKey,
  input: TemplateInput,
): PreparedEmailTemplate {
  switch (templateKey) {
    case 'services.email_verification':
      return renderEmailVerification(input);
    case 'services.professional_approved':
      return renderProfessionalApproved(input);
    case 'services.password_reset':
      return renderPasswordReset(input);
    case 'services.verification_resend':
      return renderVerificationResend(input);
    case 'services.reminder_verify_account':
      return renderReminderVerifyAccount(input);
    case 'services.reminder_missing_criminal_record':
      return renderReminderMissingCriminalRecord(input);
  }

  throw new Error('Template no soportado');
}

function renderEmailVerification(input: TemplateInput): PreparedEmailTemplate {
  const verificationUrl = requiredString(
    input.payload,
    'verificationUrl',
    'verificationUrl es obligatorio para services.email_verification',
  );
  const firstName = optionalString(input.payload, 'firstName');
  const greeting = firstName ? `Hola ${firstName},` : 'Hola,';
  const target = input.entityId ?? input.recipient;

  return {
    domain: 'auth.email',
    summary: `Correo de verificacion solicitado para usuario ${target}`,
    subject: 'Confirma tu cuenta - Ceres en Red',
    html: `
      <p>${greeting}</p>
      <p>Bienvenido a <strong>Ceres en Red</strong>.</p>
      <p>Para activar tu cuenta, hace clic en el siguiente boton:</p>
      <p>
        <a
          href="${verificationUrl}"
          style="display:inline-block;padding:10px 18px;background:#006F4B;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;"
        >
          Confirmar mi cuenta
        </a>
      </p>
      <p>Si no creaste esta cuenta, podes ignorar este correo.</p>
    `,
    text: `${greeting} Confirma tu cuenta ingresando a ${verificationUrl}`,
  };
}

function renderProfessionalApproved(
  input: TemplateInput,
): PreparedEmailTemplate {
  const loginUrl = requiredString(
    input.payload,
    'loginUrl',
    'loginUrl es obligatorio para services.professional_approved',
  );
  const firstName = optionalString(input.payload, 'firstName');
  const lastName = optionalString(input.payload, 'lastName');
  const recipientName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const greeting = recipientName ? `Hola ${recipientName},` : 'Hola,';
  const target = input.entityId ?? input.recipient;

  return {
    domain: 'admin.professionals.email',
    summary: `Correo de aprobacion solicitado para profesional ${target}`,
    subject: 'Tu perfil fue aprobado - Ceres en Red',
    html: `
      <p>${greeting}</p>
      <p>Tu perfil profesional en <strong>Ceres en Red</strong> fue aprobado por el equipo de administracion.</p>
      <p>Desde ahora ya podes ingresar a tu panel para revisar y actualizar tu informacion.</p>
      <p>
        <a
          href="${loginUrl}"
          style="display:inline-block;padding:10px 18px;background:#006F4B;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;"
        >
          Ingresar a mi panel
        </a>
      </p>
      <p>Si no solicitaste este perfil o tenes alguna duda, podes responder a este correo.</p>
    `,
    text: `${greeting} Tu perfil profesional en Ceres en Red fue aprobado. Podes ingresar desde ${loginUrl}`,
  };
}

function renderPasswordReset(input: TemplateInput): PreparedEmailTemplate {
  const resetUrl = requiredString(
    input.payload,
    'resetUrl',
    'resetUrl es obligatorio para services.password_reset',
  );
  const firstName = optionalString(input.payload, 'firstName');
  const greeting = firstName ? `Hola ${firstName},` : 'Hola,';
  const target = input.entityId ?? input.recipient;

  return {
    domain: 'auth.email',
    summary: `Correo de recuperacion solicitado para usuario ${target}`,
    subject: 'Restablecer tu contrasena - Ceres en Red',
    html: `
      <p>${greeting}</p>
      <p>Recibimos un pedido para restablecer tu contrasena en <strong>Ceres en Red</strong>.</p>
      <p>Hace clic en el siguiente boton para crear una nueva contrasena:</p>
      <p>
        <a
          href="${resetUrl}"
          style="display:inline-block;padding:10px 18px;background:#006F4B;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;"
        >
          Restablecer contrasena
        </a>
      </p>
      <p>Si no fuiste vos, podes ignorar este correo. Este enlace sera valido por 1 hora.</p>
    `,
    text: `${greeting} Restablece tu contrasena ingresando a ${resetUrl}`,
  };
}

function renderVerificationResend(input: TemplateInput): PreparedEmailTemplate {
  const verificationUrl = requiredString(
    input.payload,
    'verificationUrl',
    'verificationUrl es obligatorio para services.verification_resend',
  );
  const target = input.entityId ?? input.recipient;

  return {
    domain: 'auth.email',
    summary: `Reenvio de verificacion solicitado para usuario ${target}`,
    subject: 'Recordatorio: Confirma tu cuenta - Ceres en Red',
    html: `
      <p>Para activar tu cuenta, hace clic en el siguiente enlace:</p>
      <p><a href="${verificationUrl}">Confirmar mi cuenta</a></p>
      <p>Este enlace vence en 24 horas.</p>
    `,
    text: `Te recordamos confirma tu cuenta ingresando a: ${verificationUrl}`,
  };
}

function renderReminderVerifyAccount(
  input: TemplateInput,
): PreparedEmailTemplate {
  const verificationUrl = requiredString(
    input.payload,
    'verificationUrl',
    'verificationUrl es obligatorio para services.reminder_verify_account',
  );
  const firstName = optionalString(input.payload, 'firstName');
  const greeting = firstName ? `Hola ${firstName},` : 'Hola,';
  const target = input.entityId ?? input.recipient;

  return {
    domain: 'auth.email',
    summary: `Recordatorio de verificacion para usuario ${target}`,
    subject: 'Recordatorio: confirma tu cuenta en Ceres en Red',
    html: `
      <p>${greeting}</p>
      <p>Te recordamos que tu cuenta en <strong>Ceres en Red</strong> aun no esta verificada.</p>
      <p>Para continuar, hace clic en el siguiente boton:</p>
      <p>
        <a
          href="${verificationUrl}"
          style="display:inline-block;padding:10px 18px;background:#006F4B;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;"
        >
          Verificar mi cuenta
        </a>
      </p>
      <p>Si ya verificaste tu cuenta, podes ignorar este mensaje.</p>
    `,
    text: `${greeting} Te recordamos verificar tu cuenta ingresando a ${verificationUrl}`,
  };
}

function renderReminderMissingCriminalRecord(
  input: TemplateInput,
): PreparedEmailTemplate {
  const documentsUrl = requiredString(
    input.payload,
    'documentsUrl',
    'documentsUrl es obligatorio para services.reminder_missing_criminal_record',
  );
  const firstName = optionalString(input.payload, 'firstName');
  const greeting = firstName ? `Hola ${firstName},` : 'Hola,';
  const target = input.entityId ?? input.recipient;

  return {
    domain: 'professional.documentation',
    summary: `Recordatorio de documentacion para profesional ${target}`,
    subject:
      'Falta cargar tu certificado de antecedentes penales - Ceres en Red',
    html: `
      <p>${greeting}</p>
      <p>Tu perfil profesional en <strong>Ceres en Red</strong> todavia tiene documentacion pendiente.</p>
      <p>Necesitamos que cargues tu certificado de antecedentes penales para completar el proceso.</p>
      <p>
        <a
          href="${documentsUrl}"
          style="display:inline-block;padding:10px 18px;background:#006F4B;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;"
        >
          Cargar documentacion
        </a>
      </p>
      <p>Si ya cargaste el archivo, podes ignorar este mensaje.</p>
    `,
    text: `${greeting} Falta cargar tu certificado de antecedentes. Completa la documentacion en ${documentsUrl}`,
  };
}

function requiredString(
  payload: Record<string, unknown>,
  key: string,
  message: string,
): string {
  const value = payload[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(message);
  }
  return value.trim();
}

function optionalString(
  payload: Record<string, unknown>,
  key: string,
): string | null {
  const value = payload[key];
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}
