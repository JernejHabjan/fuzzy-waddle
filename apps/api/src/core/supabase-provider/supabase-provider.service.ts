import { Injectable } from '@nestjs/common';
import {createClient, SupabaseClient} from '@supabase/supabase-js';

@Injectable()
export class SupabaseProviderService {
  private _supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  get supabaseClient(): SupabaseClient {
    return this._supabaseClient;
  }
}
