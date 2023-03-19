import { Test, TestingModule } from '@nestjs/testing';
import {User, UsersService} from './users.service';
import { IUsersService } from './users.service.interface';

export const usersServiceStub = {
  findOne(): Promise<User> {
    return Promise.resolve({} as User);
  }
} as IUsersService;

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService]
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
