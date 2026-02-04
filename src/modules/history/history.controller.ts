import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ContactHistoryQueryDto,
  ConversationDetailsQueryDto,
  ConversationIdParamDto,
  DateRangeQueryDto,
} from './dto/history.dto';
import { HistoryService } from './history.service';
import { AdminApiKeyGuard } from '../../common/guards/admin-api-key.guard';

@UseGuards(AdminApiKeyGuard)
@Controller({ path: 'history', version: '1' })
export class HistoryController {
  constructor(private readonly service: HistoryService) {}

  @Get('last-day-interactions')
  lastDay() {
    return this.service.getLastDayInteractions();
  }

  @Get('messages-per-day')
  messagesPerDay() {
    return this.service.getMessagesPerDay();
  }

  @Get('conversation-details')
  conversationDetails(@Query() query: ConversationDetailsQueryDto) {
    return this.service.getConversationDetails(query);
  }

  @Get()
  historyByPhone(@Query() query: ContactHistoryQueryDto) {
    return this.service.getHistoryByPhone(query);
  }

  @Get('conversation/:conversationId')
  byConversationId(@Param() params: ConversationIdParamDto) {
    return this.service.getInteractionsByConversationId(params);
  }

  @Get('range')
  range(@Query() query: DateRangeQueryDto) {
    return this.service.getInteractionsByDateRange(query);
  }

  @Get('all')
  all() {
    return this.service.getAllInteractions();
  }
}
