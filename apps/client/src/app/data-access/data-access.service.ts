import { Injectable } from "@angular/core";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { environment } from "../../environments/environment";
import { type DataAccessServiceInterface } from "./data-access.service.interface";
import type { Database } from "@fuzzy-waddle/api-interfaces";

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

  private createSupabaseClient() {
    this._supabase = createClient<Database>(environment.supabase.url, environment.supabase.key);
  }
}
