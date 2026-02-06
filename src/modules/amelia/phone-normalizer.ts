export interface PhoneNormalizationResult {
  normalized: string;
  isValid: boolean;
  originalFormat: string;
  errors: string[];
}

export function normalizeArgentinePhone(
  phone: string | null | undefined,
  defaultAreaCode: string = '3564',
): PhoneNormalizationResult {
  const errors: string[] = [];
  const originalFormat = phone || '';

  if (!phone || typeof phone !== 'string') {
    return {
      normalized: '',
      isValid: false,
      originalFormat,
      errors: ['Telefono no proporcionado o formato invalido'],
    };
  }

  let cleaned = phone.replace(/[\s().+-]/g, '');

  if (!cleaned) {
    return {
      normalized: '',
      isValid: false,
      originalFormat,
      errors: ['Telefono vacio despues de limpieza'],
    };
  }

  cleaned = cleaned.replace(/^0+/, '');

  if (cleaned.startsWith('54')) {
    cleaned = cleaned.substring(2);

    if (!cleaned.startsWith('9')) {
      cleaned = '9' + cleaned;
    }

    const normalized = '+54' + cleaned;
    if (normalized.length !== 13) {
      errors.push(`Longitud incorrecta: ${normalized.length} (esperado: 13)`);
      return {
        normalized,
        isValid: false,
        originalFormat,
        errors,
      };
    }

    return {
      normalized,
      isValid: true,
      originalFormat,
      errors: [],
    };
  }

  if (cleaned.startsWith('15')) {
    cleaned = cleaned.substring(2);

    if (cleaned.length < 10) {
      cleaned = defaultAreaCode + cleaned;
    }

    const normalized = '+549' + cleaned;
    if (normalized.length !== 13) {
      errors.push(`Longitud incorrecta tras remover 15: ${normalized.length}`);
      return {
        normalized,
        isValid: false,
        originalFormat,
        errors,
      };
    }

    return {
      normalized,
      isValid: true,
      originalFormat,
      errors: [],
    };
  }

  if (cleaned.length === 10) {
    return {
      normalized: '+549' + cleaned,
      isValid: true,
      originalFormat,
      errors: [],
    };
  }

  if (cleaned.length < 10) {
    const withAreaCode = defaultAreaCode + cleaned;
    if (withAreaCode.length === 10) {
      return {
        normalized: '+549' + withAreaCode,
        isValid: true,
        originalFormat,
        errors: [],
      };
    }

    errors.push(
      `Telefono muy corto incluso con area: ${cleaned} (${cleaned.length})`,
    );
    return {
      normalized: '+549' + withAreaCode,
      isValid: false,
      originalFormat,
      errors,
    };
  }

  errors.push(`Formato no reconocido: ${cleaned} (${cleaned.length})`);
  return {
    normalized: cleaned,
    isValid: false,
    originalFormat,
    errors,
  };
}

export function isValidArgentinePhone(phone: string): boolean {
  if (!phone) return false;
  if (phone.length !== 13) return false;
  if (!phone.startsWith('+549')) return false;
  const digits = phone.substring(3);
  return /^\d{10}$/.test(digits);
}
