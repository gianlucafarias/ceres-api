import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BotApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headerKey = request.headers['x-api-key'] as string | undefined;
    const queryKey = request.query['api_key'] as string | undefined;
    const provided = headerKey ?? queryKey;
    const expected = this.config.get<string>('BOT_API_KEY');

    if (!expected || !provided || provided !== expected) {
      throw new UnauthorizedException('Invalid or missing bot API key');
    }

    return true;
  }
}
