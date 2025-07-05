import { SupabaseClient } from "@supabase/supabase-js";
import { ISupabaseProviderService } from "./supabase-provider.service.interface";

export const supabaseProviderServiceStub = {
  get supabaseClient(): SupabaseClient {
    return {} as SupabaseClient;
  }
} satisfies ISupabaseProviderService;
