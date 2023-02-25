import { Injectable } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { DataAccessService } from '../data-access/data-access.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  processing: Promise<unknown> | null = null;
  private _session: Session | null = null;

  constructor(private dataAccessService: DataAccessService) {
  }


  async signInWithGoogle() {
    const signInPromise = (this.processing = this.dataAccessService.supabase.auth.signInWithOAuth({
      provider: 'google'
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
    // if (data) {
    //   console.log('data', data);
    // }

    if (error) {
      console.error('error', error);
    }
    this._session = data.session;
    this.processing = null;
    return data.session;
  }

  get session() {
    return this._session;
  }

  get isAuthenticated() {
    return this._session !== null;
  }
}
