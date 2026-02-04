import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headerKey = request.headers['x-api-key'] as string | undefined;
    const queryKey = request.query['api_key'] as string | undefined;
    const provided = headerKey ?? queryKey;
    const expected = this.config.get<string>('ADMIN_API_KEY');

    if (!expected || !provided || provided !== expected) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }
}
