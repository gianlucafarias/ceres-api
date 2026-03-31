import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import nodemailer, { Transporter } from 'nodemailer';
import {
  PreparedEmailTemplate,
  SendEmailResult,
  StoredEmailJob,
} from './ops-email.types';

export class EmailSkipError extends Error {
  constructor(
    public readonly reason: string,
    message: string,
  ) {
    super(message);
  }
}

@Injectable()
export class OpsEmailService {
  private resendClient: Resend | null | undefined;
  private smtpTransporter: Transporter | null | undefined;

  constructor(private readonly config: ConfigService) {}

  async send(
    job: StoredEmailJob,
    prepared: PreparedEmailTemplate,
  ): Promise<SendEmailResult> {
    const providerOrder = this.resolveProviderOrder(job.providerStrategy);
    if (providerOrder.length === 0) {
      throw new EmailSkipError(
        'email_provider_not_configured',
        'No hay providers de email configurados en ceres-api',
      );
    }

    const from = this.resolveFromAddress(job.templateKey);
    if (!from) {
      throw new EmailSkipError(
        'email_sender_not_configured',
        'No hay remitente configurado para el envio de emails',
      );
    }

    let lastError: Error | null = null;
    for (const provider of providerOrder) {
      try {
        if (provider === 'resend') {
          return await this.sendWithResend(from, job.recipient, prepared);
        }

        return await this.sendWithSmtp(from, job.recipient, prepared);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
      }
    }

    throw lastError ?? new Error('No se pudo enviar el email');
  }

  private async sendWithResend(
    from: string,
    recipient: string,
    prepared: PreparedEmailTemplate,
  ): Promise<SendEmailResult> {
    const client = this.getResendClient();
    if (!client) {
      throw new EmailSkipError(
        'resend_not_configured',
        'RESEND_API_KEY no esta configurado',
      );
    }

    const result = await client.emails.send({
      from,
      to: recipient,
      subject: prepared.subject,
      html: prepared.html,
      text: prepared.text,
    });

    if (result.error) {
      throw new Error(result.error.message || 'Resend devolvio un error');
    }

    return {
      provider: 'resend',
      messageId: result.data?.id ?? null,
    };
  }

  private async sendWithSmtp(
    from: string,
    recipient: string,
    prepared: PreparedEmailTemplate,
  ): Promise<SendEmailResult> {
    const transporter = this.getSmtpTransporter();
    if (!transporter) {
      throw new EmailSkipError(
        'smtp_not_configured',
        'SMTP no esta configurado en ceres-api',
      );
    }

    const info = await transporter.sendMail({
      from,
      to: recipient,
      subject: prepared.subject,
      html: prepared.html,
      text: prepared.text,
    });

    return {
      provider: 'smtp',
      messageId: info.messageId ?? null,
    };
  }

  private resolveProviderOrder(strategy: string): Array<'resend' | 'smtp'> {
    const order: Record<string, Array<'resend' | 'smtp'>> = {
      'resend-first': ['resend', 'smtp'],
      'smtp-first': ['smtp', 'resend'],
      'resend-only': ['resend'],
      'smtp-only': ['smtp'],
    };

    return order[strategy] ?? order['resend-first'];
  }

  private resolveFromAddress(templateKey: string): string | null {
    if (templateKey.startsWith('services.')) {
      return (
        this.config.get<string>('SERVICES_EMAIL_FROM') ||
        this.config.get<string>('EMAIL_FROM_DEFAULT') ||
        this.config.get<string>('SMTP_FROM') ||
        this.config.get<string>('SMTP_USER') ||
        null
      );
    }

    return (
      this.config.get<string>('EMAIL_FROM_DEFAULT') ||
      this.config.get<string>('SMTP_FROM') ||
      this.config.get<string>('SMTP_USER') ||
      null
    );
  }

  private getResendClient(): Resend | null {
    if (this.resendClient !== undefined) {
      return this.resendClient;
    }

    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.resendClient = apiKey ? new Resend(apiKey) : null;
    return this.resendClient;
  }

  private getSmtpTransporter(): Transporter | null {
    if (this.smtpTransporter !== undefined) {
      return this.smtpTransporter;
    }

    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.smtpTransporter = null;
      return this.smtpTransporter;
    }

    const port = Number.parseInt(
      this.config.get<string>('SMTP_PORT', '465'),
      10,
    );
    const secureRaw = this.config.get<string>('SMTP_SECURE');
    const secure =
      typeof secureRaw === 'string'
        ? secureRaw.trim().toLowerCase() === 'true'
        : port === 465;
    const debug =
      this.config.get<string>('SMTP_DEBUG', 'false').trim().toLowerCase() ===
      'true';

    this.smtpTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      logger: debug,
      debug,
    });

    return this.smtpTransporter;
  }
}
