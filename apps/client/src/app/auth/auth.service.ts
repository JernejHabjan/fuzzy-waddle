import { Injectable } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { DataAccessService } from '../data-access/data-access.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  processing: Promise<unknown> | null = null;

  constructor(private dataAccessService: DataAccessService) {}

  private _session: Session | null = null;

  get session() {
    return this._session;
  }

  get fullName(): string | null {
    return (
      this.session?.user?.identities?.find((identity) => identity.provider === 'google')?.identity_data?.[
        'full_name'
      ] ?? null
    );
  }

  get accessToken(): string | null {
    return this.session?.access_token ?? null;
  }

  get userId(): string | null {
    return this.session?.user?.id ?? null;
  }

  get isAuthenticated() {
    return this._session !== null;
  }

  async signInWithGoogle() {
    const signInPromise = (this.processing = this.dataAccessService.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href }
    }));

    const { error } = await signInPromise;
    if (error) {
      console.error('error', error);
    }
    this.processing = null;
  }

  async signOut() {
    const signOutPromise = (this.processing = this.dataAccessService.supabase.auth.signOut());
    const { error } = await signOutPromise;
    if (error) {
      console.error('error', error);
    } else {
      this._session = null;
    }
    this.processing = null;
  }

  async autoSignIn(): Promise<Session | null> {
    const signInPromise = (this.processing = this.dataAccessService.supabase.auth.getSession());
    const { data, error } = await signInPromise;

    if (error) {
      console.error('error', error);
    }
    this._session = data.session;
    this.processing = null;
    return data.session;
  }
}
