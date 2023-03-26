import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { IAuthService } from './auth.service.interface';
import { usersServiceStub } from '../users/users.service.spec';

export const authServiceStub = {
  validateTest(): Promise<boolean> {
    return Promise.resolve(true);
  }
} as IAuthService;

describe('AuthService', () => {
  /**
   * https://stackoverflow.com/a/48042799/5909875
   */
  const OLD_ENV = process.env;
  let service: AuthService;

  beforeEach(async () => {
    jest.resetModules(); // Most important - it clears the cache
    process.env = { ...OLD_ENV }; // Make a copy

    process.env.SUPABASE_URL = 'http://localhost:8000';
    process.env.SUPABASE_SERVICE_KEY = 'test';
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, { provide: UsersService, useValue: usersServiceStub }, JwtService]
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
