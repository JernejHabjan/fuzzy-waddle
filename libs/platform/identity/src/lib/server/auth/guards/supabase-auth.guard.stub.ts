import { type ExecutionContext } from "@nestjs/common";
import { type SupabaseAuthGuardInterface } from "./supabase-auth.guard.interface";

export const supabaseAuthGuardStub = {
  canActivate(context: ExecutionContext): Promise<boolean> {
    return Promise.resolve(true);
  }
} satisfies SupabaseAuthGuardInterface;
