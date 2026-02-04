import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import {
  ActualizarReclamoAdminDto,
  ReclamoIdParamDto,
  ReclamosFiltroAdminDto,
} from './dto/reclamos-admin.dto';
import { ReclamosService } from './reclamos.service';

@UseGuards(AdminApiKeyGuard)
@Controller({ path: 'reclamos', version: '1' })
export class ReclamosAdminController {
  constructor(private readonly service: ReclamosService) {}

  @Get()
  listar(@Query() query: ReclamosFiltroAdminDto) {
    return this.service.listarAdmin(query);
  }

  @Get(':id')
  detalle(@Param() params: ReclamoIdParamDto) {
    return this.service.detalleAdmin(params.id);
  }

  @Patch(':id')
  actualizar(@Param() params: ReclamoIdParamDto, @Body() dto: ActualizarReclamoAdminDto) {
    return this.service.actualizarAdmin(params.id, dto);
  }

  @Get(':id/historial')
  historial(@Param() params: ReclamoIdParamDto) {
    return this.service.historialAdmin(params.id);
  }

  @Get('estadisticas/basicas')
  estadisticas() {
    return this.service.statsBasicas();
  }
}
