import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { toErrorMessage } from '../../common/utils/error-message';
import { applyHttpEtag } from '../../common/utils/http-etag';
import {
  DutyByPharmacyQueryDto,
  DutyDateParamsDto,
  DutyRangeQueryDto,
  PharmacyCodeParamsDto,
  UpdateDutyScheduleDto,
  UpdatePharmacyDto,
} from './dto/farmacias.dto';
import { FarmaciasService } from './farmacias.service';

@Controller({ path: '', version: '1' })
export class FarmaciasController {
  constructor(private readonly service: FarmaciasService) {}

  // Public
  @Get('pharmacy/:code')
  async getByCode(@Param() params: PharmacyCodeParamsDto) {
    try {
      const codeUpper = params.code.trim().toUpperCase();
      return await this.service.getPharmacyByCode(codeUpper);
    } catch (error: unknown) {
      const message = toErrorMessage(error, '');
      if (message.includes('no encontrada')) {
        throw new HttpException({ message }, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        { message: 'Error al obtener la farmacia' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Admin
  @UseGuards(AdminApiKeyGuard)
  @Put('pharmacy/:code')
  async update(
    @Param() params: PharmacyCodeParamsDto,
    @Body() body: UpdatePharmacyDto,
  ) {
    try {
      const codeUpper = params.code.trim().toUpperCase();
      const updates = this.cleanPharmacyUpdates(body);

      if (Object.keys(updates).length === 0) {
        throw new HttpException(
          {
            message: 'Debe proporcionar al menos un campo para actualizar',
            allowedFields: [
              'name',
              'address',
              'phone',
              'lat',
              'lng',
              'googleMapsAddress',
            ],
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.service.updatePharmacy(codeUpper, updates);
    } catch (error: unknown) {
      const message = toErrorMessage(error, '');
      if (message.includes('no encontrada')) {
        throw new HttpException({ message }, HttpStatus.NOT_FOUND);
      }
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { message: 'Error al actualizar la farmacia' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Public
  @Get('farmaciadeturno/today')
  async getToday() {
    const row = await this.service.getDutyToday();
    if (!row) {
      throw new HttpException(
        { message: 'No hay turno para hoy' },
        HttpStatus.NOT_FOUND,
      );
    }
    return row;
  }

  // Public
  @Get('farmaciadeturno/calendar')
  async getCalendar() {
    return this.service.getCalendar();
  }

  // Public
  @Get('farmaciadeturno')
  async getRange(@Query() query: DutyRangeQueryDto) {
    if (query.from > query.to) {
      throw new HttpException(
        { message: 'from no puede ser mayor que to' },
        HttpStatus.BAD_REQUEST,
      );
    }
    const rows = await this.service.getDutyRange(query.from, query.to);
    return { from: query.from, to: query.to, count: rows.length, rows };
  }

  // Public
  @Get('farmaciadeturno/bootstrap')
  async getBootstrap(
    @Query() query: DutyRangeQueryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (query.from > query.to) {
      throw new HttpException(
        { message: 'from no puede ser mayor que to' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const payload = await this.service.getBootstrap(query.from, query.to);
    const etagSeed = this.service.getBootstrapEtagSeed(query.from, query.to);
    if (applyHttpEtag(req, res, payload, { seed: etagSeed })) return;
    return payload;
  }

  // Public
  @Get('farmaciadeturno/:date')
  async getByDate(@Param() params: DutyDateParamsDto) {
    const row = await this.service.getDutyByDate(params.date);
    if (!row) {
      throw new HttpException(
        { message: `No hay turno para ${params.date}` },
        HttpStatus.NOT_FOUND,
      );
    }
    return row;
  }

  // Admin
  @UseGuards(AdminApiKeyGuard)
  @Put('farmaciadeturno/:date')
  async updateByDate(
    @Param() params: DutyDateParamsDto,
    @Body() body: UpdateDutyScheduleDto,
  ) {
    if (!body.pharmacyCode) {
      throw new HttpException(
        { message: 'pharmacyCode es requerido' },
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.service.updateDutyByDate(params.date, body.pharmacyCode);
  }

  // Public
  @Get('farmacia/:code/duty-schedule')
  async getByPharmacy(
    @Param() params: PharmacyCodeParamsDto,
    @Query() query: DutyByPharmacyQueryDto,
  ) {
    const code = params.code.trim().toUpperCase();
    const from = query.from || this.service.getCurrentCalendarDateISO();
    const limit = query.limit ?? 20;

    const rows = await this.service.getDutyByPharmacy(code, from, limit);
    return { code, from, count: rows.length, rows };
  }

  private cleanPharmacyUpdates(body: UpdatePharmacyDto) {
    const updates: UpdatePharmacyDto = {};

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.address !== undefined) updates.address = body.address.trim();
    if (body.phone !== undefined) updates.phone = body.phone.trim();
    if (
      body.googleMapsAddress !== undefined &&
      body.googleMapsAddress !== null
    ) {
      updates.googleMapsAddress = body.googleMapsAddress.trim();
    }
    if (body.lat !== undefined) updates.lat = body.lat;
    if (body.lng !== undefined) updates.lng = body.lng;

    return updates;
  }
}
