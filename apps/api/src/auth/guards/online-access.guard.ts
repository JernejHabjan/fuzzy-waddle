import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { type AuthUser } from "@supabase/supabase-js";
import { UserProfilesService } from "../../app/user-profiles/user-profiles.service";
import { SupabaseAuthGuard } from "./supabase-auth.guard";

@Injectable()
export class OnlineAccessGuard implements CanActivate {
  constructor(
    private readonly supabaseAuthGuard: SupabaseAuthGuard,
    private readonly userProfilesService: UserProfilesService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authenticated = await Promise.resolve(this.supabaseAuthGuard.canActivate(context));
    if (!authenticated) {
      return false;
    }

    const user = this.getUser(context);
    await this.userProfilesService.ensureOnlineAccess(user.id);
    return true;
  }

  private getUser(context: ExecutionContext): AuthUser {
    if (context.getType() === "ws") {
      return context.getArgByIndex(0).user as AuthUser;
    }

    return context.switchToHttp().getRequest().user as AuthUser;
  }
}
