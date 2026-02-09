import type { Request } from 'express';

const getFirstValue = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

export const getApiKeyFromRequest = (request: Request): string | undefined => {
  const headerValue = request.headers['x-api-key'];
  const headerKey = getFirstValue(
    typeof headerValue === 'string' || Array.isArray(headerValue)
      ? headerValue
      : undefined,
  );

  const queryValue = request.query['api_key'];
  const queryKey =
    typeof queryValue === 'string'
      ? queryValue
      : Array.isArray(queryValue) && typeof queryValue[0] === 'string'
        ? queryValue[0]
        : undefined;

  return headerKey ?? queryKey;
};

export const parseCsvKeys = (value: string | undefined): string[] => {
  if (!value) return [];

  return value
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
};
