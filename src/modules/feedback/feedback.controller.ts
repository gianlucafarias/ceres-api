import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { toErrorMessage } from '../../common/utils/error-message';
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
    } catch (error: unknown) {
      const message = toErrorMessage(error, 'Error al obtener feedback');
      throw new HttpException(
        { error: message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
