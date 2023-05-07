import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { AuthServiceInterface } from './auth.service.interface';
import { Session } from '@supabase/supabase-js';

export const authServiceStub = {
  get session(): Session | null {
    return null;
  },
  autoSignIn(): Promise<Session | null> {
    return Promise.resolve(null);
  },
  get fullName(): string | null {
    return null;
  },
  get userId(): string | null {
    return null;
  },
  get accessToken(): string | null {
    return null;
  },
  get isAuthenticated(): boolean {
    return false;
  },
  signOut(): Promise<void> {
    return Promise.resolve();
  },
  signInWithGoogle(): Promise<void> {
    return Promise.resolve();
  }
} as AuthServiceInterface;
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
