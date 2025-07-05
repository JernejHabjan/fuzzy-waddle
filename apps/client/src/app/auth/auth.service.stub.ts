import { AuthServiceInterface } from "./auth.service.interface";
import { Session } from "@supabase/supabase-js";

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
  },
  processing: null
} satisfies AuthServiceInterface;
