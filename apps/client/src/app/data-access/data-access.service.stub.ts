import { SupabaseClient } from "@supabase/supabase-js";
import { DataAccessServiceInterface } from "./data-access.service.interface";

export const dataAccessServiceStub = {
  get supabase(): SupabaseClient {
    return new SupabaseClient("http://localhost:4200", "123");
  }
} satisfies DataAccessServiceInterface;
