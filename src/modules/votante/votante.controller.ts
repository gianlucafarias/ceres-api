import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { BotApiKeyGuard } from '../../common/guards/bot-api-key.guard';
import {
  ImportarVotantesDto,
  VotanteDocumentoParamsDto,
} from './dto/votante.dto';
import { VotanteService } from './votante.service';

@Controller({ path: 'votante', version: '1' })
export class VotanteController {
  constructor(private readonly service: VotanteService) {}

  @UseGuards(BotApiKeyGuard)
  @Get(':documento')
  obtenerPorDocumento(@Param() params: VotanteDocumentoParamsDto) {
    return this.service.obtenerPorDocumento(params.documento);
  }

  @UseGuards(AdminApiKeyGuard)
  @Post('importar')
  importar(@Body() dto: ImportarVotantesDto) {
    return this.service.importar(dto);
  }
}
