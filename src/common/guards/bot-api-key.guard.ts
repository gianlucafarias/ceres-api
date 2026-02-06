import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

const getFirstValue = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

const getApiKeyFromRequest = (request: Request): string | undefined => {
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

@Injectable()
export class BotApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = getApiKeyFromRequest(request);
    const expected = this.config.get<string>('BOT_API_KEY');

    if (!expected || !provided || provided !== expected) {
      throw new UnauthorizedException('Invalid or missing bot API key');
    }

    return true;
  }
}
