import {
  EmailProviderStrategy,
  EmailTemplateKey,
  ObsActorType,
} from './observability.constants';

export type EmailJobActor = {
  type?: ObsActorType | null;
  id?: string | null;
  label?: string | null;
  email?: string | null;
  role?: string | null;
};

export type StoredEmailJob = {
  id: string;
  source: string;
  templateKey: EmailTemplateKey;
  recipient: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  requestId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  actor?: EmailJobActor | null;
  metadata?: Record<string, unknown> | null;
  providerStrategy: EmailProviderStrategy;
  attempts: number;
  createdAt: string;
  summary: string;
  domain: string;
};

export type PreparedEmailTemplate = {
  subject: string;
  html: string;
  text?: string;
  domain: string;
  summary: string;
};

export type EmailProvider = 'resend' | 'smtp';

export type SendEmailResult = {
  provider: EmailProvider;
  messageId: string | null;
};
