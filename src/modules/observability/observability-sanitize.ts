const SENSITIVE_KEYS = [
  'password',
  'token',
  'authorization',
  'secret',
  'apikey',
  'api_key',
  'verificationurl',
  'reseturl',
  'idtoken',
  'accesstoken',
] as const;

export function maskEmail(value: string | null | undefined): string | null {
  if (!value || !value.includes('@')) {
    return value ?? null;
  }

  const [local, domain] = value.split('@');
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(local.length - visible.length, 1))}@${domain}`;
}

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return SENSITIVE_KEYS.some((candidate) => normalized.includes(candidate));
}

export function sanitizeText(
  value: string | null | undefined,
  maxLength: number,
): string | null {
  if (!value) return null;
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength) || null;
}

export function sanitizeForStorage(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForStorage(item));
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, current]) => {
        if (isSensitiveKey(key)) {
          return [key, '[REDACTED]'];
        }

        if (key.toLowerCase().includes('email') && typeof current === 'string') {
          return [key, maskEmail(current)];
        }

        return [key, sanitizeForStorage(current)];
      }),
    );
  }

  if (typeof value === 'string') {
    if (/^https?:\/\//i.test(value)) {
      return '[URL_REDACTED]';
    }
    return value.slice(0, 2000);
  }

  return value;
}
