import { SupabaseClient } from "@supabase/supabase-js";

export interface DataAccessServiceInterface {
  get supabase(): SupabaseClient;
}
