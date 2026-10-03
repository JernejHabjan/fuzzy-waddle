import { type CanActivate, type ExecutionContext } from "@nestjs/common";

export interface OnlineAccessGuardInterface extends CanActivate {
  canActivate(context: ExecutionContext): Promise<boolean> | boolean;
}
