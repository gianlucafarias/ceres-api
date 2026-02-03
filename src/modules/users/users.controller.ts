import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersCountQueryDto } from './dto/users-count.dto';

@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get('count')
  getCount(@Query() query: UsersCountQueryDto) {
    return this.service.getUsersCount(query);
  }
}
