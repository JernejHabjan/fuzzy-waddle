import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { type AuthUser } from "@supabase/supabase-js";
import { UserProfilesService } from "../../app/user-profiles/user-profiles.service";
import { OnlineAccessGuard } from "./online-access.guard";

@Injectable()
export class ModeratorAccessGuard implements CanActivate {
  constructor(
    private readonly onlineAccessGuard: OnlineAccessGuard,
    private readonly userProfilesService: UserProfilesService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const hasOnlineAccess = await this.onlineAccessGuard.canActivate(context);
    if (!hasOnlineAccess) {
      return false;
    }

    const user = this.getUser(context);
    await this.userProfilesService.ensureModerator(user.id);
    return true;
  }

  private getUser(context: ExecutionContext): AuthUser {
    if (context.getType() === "ws") {
      return context.getArgByIndex(0).user as AuthUser;
    }

    return context.switchToHttp().getRequest().user as AuthUser;
  }
}
