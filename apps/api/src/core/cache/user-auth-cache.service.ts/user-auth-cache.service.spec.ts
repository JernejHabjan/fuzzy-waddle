import { Test, TestingModule } from '@nestjs/testing';
import { UserAuthCacheService } from './user-auth-cache.service';
import { AuthUser } from '@supabase/supabase-js';

describe('UserAuthCacheService', () => {
  let service: UserAuthCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserAuthCacheService]
    }).compile();

    service = module.get<UserAuthCacheService>(UserAuthCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should set and get user', () => {
    const user: AuthUser = {
      user_metadata: undefined,
      id: undefined,
      app_metadata: {
        provider: undefined
      },
      aud: undefined,
      confirmation_sent_at: undefined,
      confirmed_at: undefined,
      created_at: undefined,
      email: undefined,
      last_sign_in_at: undefined,
      role: undefined
    };
    const idToken = 'idToken';
    service.setUser(idToken, user);
    expect(service.getUser(idToken)).toEqual(user);
  });
});
