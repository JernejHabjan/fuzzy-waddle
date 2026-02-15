import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../../api/src/types/database.types";

export interface DataAccessServiceInterface {
  get supabase(): SupabaseClient<Database>;
}
