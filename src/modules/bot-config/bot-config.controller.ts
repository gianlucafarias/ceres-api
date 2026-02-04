import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { BotConfigService } from './bot-config.service';
import { BotConfigKeyParamsDto, CreateBotConfigDto, UpdateBotConfigDto } from './dto/bot-config.dto';

@Controller({ path: 'config', version: '1' })
export class BotConfigController {
  constructor(private readonly service: BotConfigService) {}

  @Get()
  async getAll() {
    try {
      return await this.service.getAll();
    } catch (error: any) {
      throw new HttpException({ message: 'Error interno del servidor' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':clave')
  async getByKey(@Param() params: BotConfigKeyParamsDto) {
    const clave = params.clave;
    if (!clave) {
      throw new HttpException({ message: 'Falta el parametro "clave" en la ruta.' }, HttpStatus.BAD_REQUEST);
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
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException({ message: 'Error interno del servidor' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':clave')
  async create(@Param() params: BotConfigKeyParamsDto, @Body() body: CreateBotConfigDto) {
    const clave = params.clave;
    if (!clave) {
      throw new HttpException({ message: 'Falta el parametro "clave" en la ruta.' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const config = await this.service.create(clave, body);
      return {
        message: `Configuracion con clave "${clave}" creada correctamente.`,
        config,
      };
    } catch (error: any) {
      if (error?.message?.includes('fecha_expiracion')) {
        throw new HttpException({ message: error.message }, HttpStatus.BAD_REQUEST);
      }
      if (error?.status === HttpStatus.CONFLICT) {
        throw new HttpException({ message: error.message }, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        { message: 'Error interno del servidor al crear la configuracion.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':clave')
  async update(@Param() params: BotConfigKeyParamsDto, @Body() body: UpdateBotConfigDto) {
    const clave = params.clave;
    if (!clave) {
      throw new HttpException({ message: 'Falta el parametro "clave" en la ruta.' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const config = await this.service.update(clave, body);
      return {
        message: `Configuracion con clave "${clave}" actualizada correctamente.`,
        config,
      };
    } catch (error: any) {
      if (error?.message?.includes('fecha_expiracion')) {
        throw new HttpException({ message: error.message }, HttpStatus.BAD_REQUEST);
      }
      if (error?.status === HttpStatus.NOT_FOUND) {
        throw new HttpException({ message: error.message }, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        { message: 'Error interno del servidor al actualizar la configuracion.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
