import { Injectable } from "@angular/core";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { environment } from "@fuzzy-waddle/environments/environment";
import { type DataAccessServiceInterface } from "./data-access.service.interface";
import type { Database } from "@fuzzy-waddle/platform-database-schema";

@Injectable({
  providedIn: "root"
})
export class DataAccessService implements DataAccessServiceInterface {
  constructor() {
    this.createSupabaseClient();
  }

  private _supabase!: SupabaseClient<Database>;

  get supabase(): SupabaseClient<Database> {
    return this._supabase;
  }

  /** Uses PKCE so desktop deep links carry a short one-time code instead of session credentials. */
  private createSupabaseClient() {
    this._supabase = createClient<Database>(environment.supabase.url, environment.supabase.key, {
      auth: {
        flowType: "pkce"
      }
    });
  }
}
