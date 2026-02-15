import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@fuzzy-waddle/api-interfaces";

export interface DataAccessServiceInterface {
  get supabase(): SupabaseClient<Database>;
}
