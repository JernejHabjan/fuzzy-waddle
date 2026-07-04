import { type ExecutionContext } from "@nestjs/common";
import { type OnlineAccessGuardInterface } from "./online-access.guard.interface";

export const onlineAccessGuardStub = {
  canActivate(context: ExecutionContext): Promise<boolean> {
    return Promise.resolve(true);
  }
} satisfies OnlineAccessGuardInterface;
