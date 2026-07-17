import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@fuzzy-waddle/platform-database-schema";

export interface ISupabaseProviderService {
  get supabaseClient(): SupabaseClient<Database>;
}
