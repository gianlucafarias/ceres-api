import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AnyApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headerKey = request.headers['x-api-key'] as string | undefined;
    const queryKey = request.query['api_key'] as string | undefined;
    const provided = headerKey ?? queryKey;
    const adminKey = this.config.get<string>('ADMIN_API_KEY');
    const botKey = this.config.get<string>('BOT_API_KEY');

    if (!provided || (!adminKey && !botKey)) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    if (provided !== adminKey && provided !== botKey) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }
}
