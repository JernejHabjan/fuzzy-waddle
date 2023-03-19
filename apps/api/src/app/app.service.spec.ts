import { Test } from '@nestjs/testing';

import { AppService } from './app.service';
import { Message } from '@fuzzy-waddle/api-interfaces';
import { IAppService } from './app.service.interface';

export const AppServiceStub = {
  getData: () => ({ message: 'Welcome to api!' } as Message)
} as IAppService;

describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService]
    }).compile();

    service = app.get<AppService>(AppService);
  });

  describe('getData', () => {
    it('should return "Welcome to api!"', () => {
      expect(service.getData()).toEqual({ message: 'Welcome to api!' });
    });
  });
});
