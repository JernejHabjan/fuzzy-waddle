import { type CanActivate, type ExecutionContext } from "@nestjs/common";

export interface SupabaseAuthGuardInterface extends CanActivate {
  canActivate(context: ExecutionContext): Promise<boolean> | boolean;
}
