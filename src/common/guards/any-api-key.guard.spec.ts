import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnyApiKeyGuard } from './any-api-key.guard';

const mockContext = (
  headers: Record<string, string> = {},
  query: Record<string, string> = {},
) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ headers, query }),
    }),
  }) as unknown as ExecutionContext;

describe('AnyApiKeyGuard', () => {
  it('permite si coincide con admin', () => {
    const guard = new AnyApiKeyGuard({
      get: (k: string) => (k === 'ADMIN_API_KEY' ? 'admin' : 'bot'),
    } as unknown as ConfigService);
    expect(guard.canActivate(mockContext({ 'x-api-key': 'admin' }, {}))).toBe(
      true,
    );
  });

  it('permite si coincide con bot', () => {
    const guard = new AnyApiKeyGuard({
      get: (k: string) => (k === 'ADMIN_API_KEY' ? 'admin' : 'bot'),
    } as unknown as ConfigService);
    expect(guard.canActivate(mockContext({ 'x-api-key': 'bot' }, {}))).toBe(
      true,
    );
  });

  it('lanza Unauthorized si es inválida', () => {
    const guard = new AnyApiKeyGuard({
      get: (k: string) => (k === 'ADMIN_API_KEY' ? 'admin' : 'bot'),
    } as unknown as ConfigService);
    expect(() =>
      guard.canActivate(mockContext({ 'x-api-key': 'wrong' }, {})),
    ).toThrow(UnauthorizedException);
  });
});
