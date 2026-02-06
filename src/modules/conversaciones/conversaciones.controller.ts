import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { toErrorMessage } from '../../common/utils/error-message';
import { ConversacionesQueryDto } from './dto/conversaciones.dto';
import { ConversacionesService } from './conversaciones.service';

@UseGuards(AdminApiKeyGuard)
@Controller({ path: 'conversaciones', version: '1' })
export class ConversacionesController {
  constructor(private readonly service: ConversacionesService) {}

  @Get()
  async getAll(@Query() query: ConversacionesQueryDto) {
    try {
      const conversaciones = await this.service.getAll(query.from, query.to);
      return conversaciones;
    } catch (error: unknown) {
      const message = toErrorMessage(
        error,
        'Error al obtener las conversaciones',
      );
      throw new HttpException(
        { error: message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
