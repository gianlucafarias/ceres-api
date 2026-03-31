export const OBS_EVENT_KINDS = ['audit', 'workflow', 'request'] as const;
export type ObsEventKind = (typeof OBS_EVENT_KINDS)[number];

export const OBS_EVENT_STATUSES = [
  'success',
  'failure',
  'warning',
  'skipped',
] as const;
export type ObsEventStatus = (typeof OBS_EVENT_STATUSES)[number];

export const OBS_ACTOR_TYPES = ['admin_user', 'end_user', 'system'] as const;
export type ObsActorType = (typeof OBS_ACTOR_TYPES)[number];

export const EMAIL_PROVIDER_STRATEGIES = [
  'resend-first',
  'smtp-first',
  'resend-only',
  'smtp-only',
] as const;
export type EmailProviderStrategy = (typeof EMAIL_PROVIDER_STRATEGIES)[number];

export const EMAIL_TEMPLATE_KEYS = [
  'services.email_verification',
  'services.professional_approved',
  'services.password_reset',
  'services.verification_resend',
] as const;
export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];
