import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ContactIdParamDto,
  ContactsQueryDto,
  ConversationsRangeQueryDto,
} from './dto/contacts.dto';
import { ContactsService } from './contacts.service';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';
import { applyHttpEtag } from '../../common/utils/http-etag';

@UseGuards(AdminApiKeyGuard)
@Controller({ path: 'contacts', version: '1' })
export class ContactsController {
  constructor(private readonly service: ContactsService) {}

  @Get('last-interactions')
  async getLastInteractions(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const payload = await this.service.getLastUserInteractions();
    if (applyHttpEtag(req, res, payload)) return;
    return payload;
  }

  @Get()
  getContacts(@Query() query: ContactsQueryDto) {
    return this.service.getContacts(query);
  }

  @Get(':id')
  async getContact(@Param() params: ContactIdParamDto) {
    const result = await this.service.getContactDetailsById(params.id);
    if (!result) {
      throw new NotFoundException('Contacto no encontrado');
    }
    return result;
  }

  @Get(':id/conversations')
  getConversations(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ConversationsRangeQueryDto,
  ) {
    return this.service.getContactConversations(id, query);
  }
}
