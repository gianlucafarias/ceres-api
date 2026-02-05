import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { BotApiKeyGuard } from '../../common/guards/bot-api-key.guard';
import { ConsultarDeudaDto, PdfParamsDto, SolicitarCedulonDto } from './dto/impuestos.dto';
import type { ConsultaResponse, SolicitarCedulonResponse } from './impuestos.service';
import { ImpuestosService } from './impuestos.service';

@UseGuards(BotApiKeyGuard)
@Controller({ path: 'impuestos', version: '1' })
export class ImpuestosController {
  constructor(private readonly service: ImpuestosService) {}

  @Post('consulta')
  consulta(@Body() body: Record<string, unknown>): Promise<ConsultaResponse> {
    return this.service.consulta(body);
  }

  @Get('pdf/:tipo/:partida')
  async getPdf(@Param() params: PdfParamsDto) {
    const resultado = await this.service.obtenerPdf(params.partida, params.tipo);
    if (resultado.error) {
      throw new HttpException(resultado, HttpStatus.BAD_REQUEST);
    }
    return resultado;
  }

  @Post('consultar-deuda')
  async consultarDeuda(@Body() dto: ConsultarDeudaDto): Promise<ConsultaResponse> {
    const resultado = await this.service.consultarDeuda(dto);
    if (!resultado || resultado.RESU !== 'OK') {
      throw new HttpException(resultado || { error: 'Error en la consulta de deuda' }, HttpStatus.BAD_REQUEST);
    }
    return resultado;
  }

  @Post('solicitar-cedulon')
  async solicitarCedulon(@Body() dto: SolicitarCedulonDto): Promise<SolicitarCedulonResponse> {
    const resultado = await this.service.solicitarCedulon(dto);
    if (!resultado || !this.hasResu(resultado) || resultado.RESU !== 'OK') {
      throw new HttpException(resultado || { error: 'Error en la solicitud de cedulon' }, HttpStatus.BAD_REQUEST);
    }
    return resultado;
  }

  private hasResu(value: unknown): value is { RESU: string } {
    return (
      typeof value === 'object' &&
      value !== null &&
      'RESU' in value &&
      typeof (value as Record<string, unknown>).RESU === 'string'
    );
  }
}
