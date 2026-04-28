import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import {
  TipoReclamoIdParamDto,
  UpsertTipoReclamoDto,
} from './dto/tipos-reclamo.dto';
import { TiposReclamoService } from './tipos-reclamo.service';

@UseGuards(AdminApiKeyGuard)
@Controller({ path: 'reclamos/admin/tipos', version: '1' })
export class TiposReclamoController {
  constructor(private readonly service: TiposReclamoService) {}

  @Get()
  listar() {
    return this.service.listar();
  }

  @Post()
  crear(@Body() dto: UpsertTipoReclamoDto) {
    return this.service.crear(dto);
  }

  @Patch(':id')
  actualizar(
    @Param() params: TipoReclamoIdParamDto,
    @Body() dto: UpsertTipoReclamoDto,
  ) {
    return this.service.actualizar(params.id, dto);
  }

  @Delete(':id')
  eliminar(@Param() params: TipoReclamoIdParamDto) {
    return this.service.eliminar(params.id);
  }
}
