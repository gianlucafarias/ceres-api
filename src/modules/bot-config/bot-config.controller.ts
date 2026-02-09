import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { toErrorMessage } from '../../common/utils/error-message';
import { BotConfigService } from './bot-config.service';
import {
  BotConfigKeyParamsDto,
  CreateBotConfigDto,
  UpdateBotConfigDto,
} from './dto/bot-config.dto';

@UseGuards(AdminApiKeyGuard)
@Controller({ path: 'config', version: '1' })
export class BotConfigController {
  constructor(private readonly service: BotConfigService) {}

  @Get()
  async getAll() {
    try {
      return await this.service.getAll();
    } catch (error: unknown) {
      const message = toErrorMessage(error, 'Error interno del servidor');
      throw new HttpException({ message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':clave')
  async getByKey(@Param() params: BotConfigKeyParamsDto) {
    const clave = params.clave;
    if (!clave) {
      throw new HttpException(
        { message: 'Falta el parametro "clave" en la ruta.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const config = await this.service.getByKey(clave);
      if (!config) {
        throw new HttpException(
          { message: `Configuracion con clave "${clave}" no encontrada.` },
          HttpStatus.NOT_FOUND,
        );
      }
      return config;
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;
      const message = toErrorMessage(error, 'Error interno del servidor');
      throw new HttpException({ message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':clave')
  async create(
    @Param() params: BotConfigKeyParamsDto,
    @Body() body: CreateBotConfigDto,
  ) {
    const clave = params.clave;
    if (!clave) {
      throw new HttpException(
        { message: 'Falta el parametro "clave" en la ruta.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const config = await this.service.create(clave, body);
      return config;
    } catch (error: unknown) {
      const message = toErrorMessage(
        error,
        'Error interno del servidor al crear la configuracion.',
      );
      if (message.includes('fecha_expiracion')) {
        throw new HttpException({ message }, HttpStatus.BAD_REQUEST);
      }
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { message: 'Error interno del servidor al crear la configuracion.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':clave')
  async update(
    @Param() params: BotConfigKeyParamsDto,
    @Body() body: UpdateBotConfigDto,
  ) {
    const clave = params.clave;
    if (!clave) {
      throw new HttpException(
        { message: 'Falta el parametro "clave" en la ruta.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const config = await this.service.update(clave, body);
      return config;
    } catch (error: unknown) {
      const message = toErrorMessage(
        error,
        'Error interno del servidor al actualizar la configuracion.',
      );
      if (message.includes('fecha_expiracion')) {
        throw new HttpException({ message }, HttpStatus.BAD_REQUEST);
      }
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          message: 'Error interno del servidor al actualizar la configuracion.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
