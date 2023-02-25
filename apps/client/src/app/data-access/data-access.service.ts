import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DataAccessService {
  private _supabase!: SupabaseClient;

  constructor() {
    this.createSupabaseClient();
  }
  private createSupabaseClient() {
    this._supabase = createClient(environment.supabase.url, environment.supabase.key);
  }

  get supabase(): SupabaseClient {
    return this._supabase;
  }
}
