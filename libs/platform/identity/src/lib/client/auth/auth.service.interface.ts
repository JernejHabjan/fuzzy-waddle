import { type Session } from "@supabase/supabase-js";
import type { Signal } from "@angular/core";
import type { Observable } from "rxjs";

export interface AuthServiceInterface {
  processing: Promise<unknown> | null;
  readonly isDesktopSignInPending: Signal<boolean>;
  readonly sessionChanges: Observable<Session | null>;
  get session(): Session | null;
  get fullName(): string | null;
  get accessToken(): string | null;
  get userId(): string | null;
  get isAuthenticated(): boolean;
  signInWithGoogle(): Promise<void>;
  cancelSignIn(): void;
  signOut(): Promise<void>;
  autoSignIn(): Promise<Session | null>;
  ensureAuthReady(): Promise<Session | null>;
}
