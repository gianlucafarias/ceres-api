import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { getApiKeyFromRequest, parseCsvKeys } from './api-key.helpers';

@Injectable()
export class OpsEventsApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = getApiKeyFromRequest(request);

    if (!provided) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    const configuredKeys = parseCsvKeys(
      this.config.get<string>('OPS_EVENTS_API_KEYS'),
    );

    const validKeys =
      configuredKeys.length > 0
        ? configuredKeys
        : [
            this.config.get<string>('OPS_API_KEY'),
            this.config.get<string>('ADMIN_API_KEY'),
            this.config.get<string>('BOT_API_KEY'),
          ].filter((value): value is string => !!value);

    if (validKeys.length === 0 || !validKeys.includes(provided)) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }
}
