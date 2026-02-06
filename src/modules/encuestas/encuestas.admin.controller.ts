import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { EncuestasService } from './encuestas.service';
import {
  EditarEncuestaDto,
  EncuestaIdParamDto,
  EncuestasQueryDto,
} from './dto/encuestas-admin.dto';

@UseGuards(AdminApiKeyGuard)
@Controller({ path: 'encuestaobras', version: '1' })
export class EncuestasAdminController {
  constructor(private readonly service: EncuestasService) {}

  @Get('estadisticas')
  async estadisticas(@Query('barrio') barrio?: string) {
    const data = await this.service.obtenerEstadisticas(barrio);
    return { success: true, data };
  }

  @Get('estadisticas-redis')
  async estadisticasRedis() {
    const data = await this.service.obtenerEstadisticasRedis();
    return { success: true, data };
  }

  @Get('por-barrio/:barrio')
  async porBarrio(@Param('barrio') barrio: string) {
    const encuestas = await this.service.obtenerPorBarrio(barrio);
    return {
      success: true,
      data: {
        barrio,
        cantidad: encuestas.length,
        encuestas,
      },
    };
  }

  @Get('todas')
  async todas(@Query() query: EncuestasQueryDto) {
    const data = await this.service.obtenerTodas(query);
    return { success: true, data };
  }

  @Get('respuesta/:id')
  async respuesta(@Param() params: EncuestaIdParamDto) {
    const encuesta = await this.service.obtenerEncuesta(params.id);
    if (!encuesta) {
      throw new NotFoundException({
        success: false,
        error: 'Encuesta no encontrada',
      });
    }
    return { success: true, data: encuesta };
  }

  @Put('editar/:id')
  async editar(
    @Param() params: EncuestaIdParamDto,
    @Body() dto: EditarEncuestaDto,
  ) {
    const encuesta = await this.service.editarEncuesta(params.id, dto);
    if (!encuesta) {
      throw new NotFoundException({
        success: false,
        error: 'Encuesta no encontrada',
      });
    }
    return {
      success: true,
      mensaje: 'Encuesta editada correctamente',
      data: encuesta,
    };
  }

  @Delete('eliminar/:id')
  async eliminar(@Param() params: EncuestaIdParamDto) {
    const deleted = await this.service.eliminarEncuesta(params.id);
    if (!deleted) {
      throw new NotFoundException({
        success: false,
        error: 'Encuesta no encontrada',
      });
    }
    return { success: true, mensaje: 'Encuesta eliminada correctamente' };
  }

  @Get(':id')
  async porId(@Param() params: EncuestaIdParamDto) {
    const encuesta = await this.service.obtenerEncuesta(params.id);
    if (!encuesta) {
      throw new NotFoundException({
        success: false,
        error: 'Encuesta no encontrada',
      });
    }
    return { success: true, data: encuesta };
  }
}
