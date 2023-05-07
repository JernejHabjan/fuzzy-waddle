import { Session } from '@supabase/supabase-js';

export interface AuthServiceInterface {
  processing: Promise<unknown> | null;
  get session(): Session | null;
  get fullName(): string | null;
  get accessToken(): string | null;
  get userId(): string | null;
  get isAuthenticated(): boolean;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
  autoSignIn(): Promise<Session | null>;
}
