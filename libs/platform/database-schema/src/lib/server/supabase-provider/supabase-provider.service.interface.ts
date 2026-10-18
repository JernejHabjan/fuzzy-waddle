import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../database/database.types";

export interface ISupabaseProviderService {
  get supabaseClient(): SupabaseClient<Database>;
}
