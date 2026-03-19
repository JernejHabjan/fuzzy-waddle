import { Injectable } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { type ISupabaseProviderService } from "./supabase-provider.service.interface";
import type { Database } from "@fuzzy-waddle/api-interfaces";

@Injectable()
export class SupabaseProviderService implements ISupabaseProviderService {
  private _supabaseClient = createClient<Database>(
    process.env.SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_KEY ?? ""
  );
  get supabaseClient(): SupabaseClient<Database> {
    return this._supabaseClient;
  }
}
