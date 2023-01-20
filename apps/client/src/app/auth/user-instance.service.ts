import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CredentialResponse } from 'google-one-tap';

@Injectable({
  providedIn: 'root'
})
export class UserInstanceService {
  isLoggedIn = false;
  private supabase!: SupabaseClient;

  getPageTheme = () => 'light';
  getPreferredGames = () => ['probable-waffle'];

  constructor() {
    this.createSupabaseClient();
  }
  private createSupabaseClient() {
    const supabaseUrl = 'https://bhzetyxjimpabioxoodz.supabase.co';
    const SUPABASE_KEY =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoemV0eXhqaW1wYWJpb3hvb2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzM3OTQ4NTcsImV4cCI6MTk4OTM3MDg1N30.qXNM5FGjVb9scqNxBL3EHYl1HL-RI2NZNGXceZGTMLs';
    const supabaseKey = SUPABASE_KEY;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async signInWithGoogle() {
    const { user, session, error } = await this.supabase.auth.signIn({
      provider: 'google'
    });
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
  }



  /**
   * google one tap callback
   */
  handleCredentialResponse(response: CredentialResponse) {
// Decoding  JWT token...
    let decodedToken: any | null = null;
    try {
      decodedToken = JSON.parse(atob(response?.credential.split('.')[1]));
      // todo login with supabase?
    } catch (e) {
      console.error('Error while trying to decode token', e);
    }
    console.log('decodedToken', decodedToken);
  }
}
