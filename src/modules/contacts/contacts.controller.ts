import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ContactIdParamDto,
  ContactsQueryDto,
  ConversationsRangeQueryDto,
} from './dto/contacts.dto';
import { ContactsService } from './contacts.service';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';

@UseGuards(AdminApiKeyGuard)
@Controller({ path: 'contacts', version: '1' })
export class ContactsController {
  constructor(private readonly service: ContactsService) {}

  @Get('last-interactions')
  getLastInteractions() {
    return this.service.getLastUserInteractions();
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
