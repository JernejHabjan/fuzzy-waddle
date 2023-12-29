import { Injectable } from "@angular/core";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { environment } from "../../environments/environment";
import { DataAccessServiceInterface } from "./data-access.service.interface";

@Injectable({
  providedIn: "root"
})
export class DataAccessService implements DataAccessServiceInterface {
  constructor() {
    this.createSupabaseClient();
  }

  private _supabase!: SupabaseClient;

  get supabase(): SupabaseClient {
    return this._supabase;
  }

  private createSupabaseClient() {
    this._supabase = createClient(environment.supabase.url, environment.supabase.key);
  }
}
