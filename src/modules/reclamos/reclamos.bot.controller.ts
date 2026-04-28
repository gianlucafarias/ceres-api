import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BotApiKeyGuard } from '../../common/guards/bot-api-key.guard';
import {
  CrearReclamoBotDto,
  UltimoReclamoBotQueryDto,
} from './dto/reclamos-bot.dto';
import { ReclamosService } from './reclamos.service';

@UseGuards(BotApiKeyGuard)
@Controller({ path: 'reclamos/bot', version: '1' })
export class ReclamosBotController {
  constructor(private readonly service: ReclamosService) {}

  @Post()
  crear(@Body() dto: CrearReclamoBotDto) {
    return this.service.crearDesdeBot(dto);
  }

  @Get('tipos')
  tipos() {
    return this.service.tiposParaBot();
  }

  @Get('ultimo')
  ultimo(@Query() query: UltimoReclamoBotQueryDto) {
    return this.service.ultimoPorTelefonoParaBot(query.telefono);
  }

  @Get(':id/estado')
  estado(@Param('id', ParseIntPipe) id: number) {
    return this.service.estadoParaBot(id);
  }
}
