import { SupabaseClient } from '@supabase/supabase-js';

export interface ISupabaseProviderService {
  get supabaseClient(): SupabaseClient;
}
