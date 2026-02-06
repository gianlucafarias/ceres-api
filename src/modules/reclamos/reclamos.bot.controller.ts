import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { BotApiKeyGuard } from '../../common/guards/bot-api-key.guard';
import {
  EstadoReclamoBotParamsDto,
  CrearReclamoBotDto,
} from './dto/reclamos-bot.dto';
import { ReclamosService } from './reclamos.service';

@UseGuards(BotApiKeyGuard)
@Controller({ path: 'reclamos', version: '1' })
export class ReclamosBotController {
  constructor(private readonly service: ReclamosService) {}

  @Post()
  crear(@Body() dto: CrearReclamoBotDto) {
    return this.service.crearDesdeBot(dto);
  }

  @Get(':id/estado')
  estado(@Param() params: EstadoReclamoBotParamsDto) {
    return this.service.estadoParaBot(params.id);
  }
}
