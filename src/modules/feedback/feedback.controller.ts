import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { toErrorMessage } from '../../common/utils/error-message';
import { applyHttpEtag } from '../../common/utils/http-etag';
import { FeedbackService } from './feedback.service';

@UseGuards(AdminApiKeyGuard)
@Controller({ path: 'feedback', version: '1' })
export class FeedbackController {
  constructor(private readonly service: FeedbackService) {}

  @Get()
  async getAll(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      const feedback = await this.service.getAll();
      if (applyHttpEtag(req, res, feedback)) return;
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
