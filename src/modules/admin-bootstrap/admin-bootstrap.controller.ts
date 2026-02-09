import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { AdminBootstrapService } from './admin-bootstrap.service';

@UseGuards(AdminApiKeyGuard)
@Controller({ path: 'admin', version: '1' })
export class AdminBootstrapController {
  constructor(private readonly service: AdminBootstrapService) {}

  @Get('bootstrap')
  getBootstrap() {
    return this.service.getBootstrap();
  }
}
