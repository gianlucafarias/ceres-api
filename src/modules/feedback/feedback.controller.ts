import { Controller, Get, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { FeedbackService } from './feedback.service';

@UseGuards(AdminApiKeyGuard)
@Controller({ path: 'feedback', version: '1' })
export class FeedbackController {
  constructor(private readonly service: FeedbackService) {}

  @Get()
  async getAll() {
    try {
      const feedback = await this.service.getAll();
      return feedback;
    } catch (error: any) {
      throw new HttpException({ error: 'Error al obtener feedback' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
