import { Injectable } from "@angular/core";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { environment } from "@fuzzy-waddle/environments/environment";
import { type DataAccessServiceInterface } from "./data-access.service.interface";
import type { Database } from "@fuzzy-waddle/platform-database-schema";
import { readMultiplayerE2eAuthConfig } from "./multiplayer-e2e-auth-config";

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

  /** Uses PKCE; only a local development harness may replace the public Supabase endpoint/key before client creation. */
  private createSupabaseClient() {
    const config = readMultiplayerE2eAuthConfig() ?? environment.supabase;
    this._supabase = createClient<Database>(config.url, config.key, {
      auth: {
        flowType: "pkce"
      }
    });
  }
}
