import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Contact } from '../../entities/contact.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let qbMock: any;

  beforeEach(async () => {
    qbMock = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(5),
    };

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(Contact),
          useValue: {
            createQueryBuilder: jest.fn(() => qbMock),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('retorna count sin rango', async () => {
    const res = await service.getUsersCount({});
    expect(res).toEqual({ count: 5 });
    expect(qbMock.getCount).toHaveBeenCalled();
  });
});
