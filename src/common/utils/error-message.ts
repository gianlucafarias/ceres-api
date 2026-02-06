export function toErrorMessage(
  error: unknown,
  fallback = 'Error interno del servidor',
): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
