import { type CanActivate, type ExecutionContext } from "@nestjs/common";
import { type Observable } from "rxjs";

export interface SupabaseAuthGuardInterface extends CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>;
}
