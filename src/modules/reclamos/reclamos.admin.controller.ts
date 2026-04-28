import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import {
  ActualizarReclamoAdminDto,
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

  @Get('estadisticas/basicas')
  estadisticasBasicas() {
    return this.service.statsBasicas();
  }

  @Get('estadisticas')
  estadisticasAvanzadas() {
    return this.service.statsAvanzadas();
  }

  @Get('count-by-status')
  countByStatus() {
    return this.service.countByEstado();
  }

  @Get('count-by-priority')
  countByPriority() {
    return this.service.countByPrioridad();
  }

  @Get('count-by-type')
  countByType() {
    return this.service.countByTipo();
  }

  @Get('count-by-barrio')
  countByBarrio() {
    return this.service.countByBarrio();
  }

  @Get(':id/historial')
  historial(@Param('id', ParseIntPipe) id: number) {
    return this.service.historialAdmin(id);
  }

  @Get(':id/relacionados')
  relacionados(@Param('id', ParseIntPipe) id: number) {
    return this.service.relacionadosAdmin(id);
  }

  @Get(':id')
  detalle(@Param('id', ParseIntPipe) id: number) {
    return this.service.detalleAdmin(id);
  }

  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarReclamoAdminDto,
  ) {
    return this.service.actualizarAdmin(id, dto);
  }
}
