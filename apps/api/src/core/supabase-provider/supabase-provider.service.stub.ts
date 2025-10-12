import { SupabaseClient } from "@supabase/supabase-js";
import { type ISupabaseProviderService } from "./supabase-provider.service.interface";

export const supabaseProviderServiceStub = {
  get supabaseClient(): SupabaseClient {
    return {} as SupabaseClient;
  }
} satisfies ISupabaseProviderService;
