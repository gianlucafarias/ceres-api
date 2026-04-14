import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { getApiKeyFromRequest } from './api-key.helpers';

@Injectable()
export class OpsApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = getApiKeyFromRequest(request);
    const coreAdminKey = this.config.get<string>('CORE_API_ADMIN_KEY');
    const opsKey = this.config.get<string>('OPS_API_KEY');
    const adminKey = this.config.get<string>('ADMIN_API_KEY');

    const validKeys = [coreAdminKey, opsKey, adminKey].filter(
      (value): value is string => !!value,
    );

    if (!provided || validKeys.length === 0 || !validKeys.includes(provided)) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }
}
