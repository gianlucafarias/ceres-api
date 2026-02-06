import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminApiKeyGuard } from './admin-api-key.guard';

const mockContext = (
  headers: Record<string, string> = {},
  query: Record<string, string> = {},
) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ headers, query }),
    }),
  }) as unknown as ExecutionContext;

describe('AdminApiKeyGuard', () => {
  it('permite si la API key coincide', () => {
    const guard = new AdminApiKeyGuard({
      get: () => 'secret',
    } as unknown as ConfigService);
    const canActivate = guard.canActivate(
      mockContext({ 'x-api-key': 'secret' }, {}),
    );
    expect(canActivate).toBe(true);
  });

  it('lanza Unauthorized si falta o es incorrecta', () => {
    const guard = new AdminApiKeyGuard({
      get: () => 'secret',
    } as unknown as ConfigService);
    expect(() => guard.canActivate(mockContext())).toThrow(
      UnauthorizedException,
    );
  });
});
