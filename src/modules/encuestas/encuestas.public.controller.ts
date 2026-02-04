import { Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Post } from '@nestjs/common';
import { EncuestasService } from './encuestas.service';
import { GuardarEncuestaDto, ValidarDniDto } from './dto/encuestas-public.dto';

@Controller({ path: '', version: '1' })
export class EncuestasPublicController {
  constructor(private readonly service: EncuestasService) {}

  @Post('validar-dni')
  async validarDni(@Body() dto: ValidarDniDto) {
    const result = await this.service.validarDni(dto.dni);
    return {
      success: true,
      ...result,
    };
  }

  @Post('guardar')
  async guardar(@Body() dto: GuardarEncuestaDto) {
    const encuesta = await this.service.guardarEncuesta(dto);
    return {
      success: true,
      mensaje: 'Encuesta guardada correctamente',
      id: encuesta.id,
      dni: encuesta.dni,
      timestamp: Date.now(),
      procesamiento: 'Guardado en base de datos',
    };
  }

  @Get('encuestaobras/estado/:id')
  async estado(@Param('id', ParseIntPipe) id: number) {
    const data = await this.service.obtenerEstadoPublico(id);
    if (!data) {
      throw new NotFoundException({ success: false, error: 'Encuesta no encontrada' });
    }
    return {
      success: true,
      data,
    };
  }
}
