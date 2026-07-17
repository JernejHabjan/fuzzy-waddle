import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthStrategies } from "../strategies/auth-strategies";
import { type SupabaseAuthGuardInterface } from "./supabase-auth.guard.interface";

@Injectable()
export class SupabaseAuthGuard extends AuthGuard(AuthStrategies.supabase) implements SupabaseAuthGuardInterface {}
