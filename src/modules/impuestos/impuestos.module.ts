import { Module } from '@nestjs/common';
import { ImpuestosController } from './impuestos.controller';
import { ImpuestosService } from './impuestos.service';

@Module({
  controllers: [ImpuestosController],
  providers: [ImpuestosService],
})
export class ImpuestosModule {}
