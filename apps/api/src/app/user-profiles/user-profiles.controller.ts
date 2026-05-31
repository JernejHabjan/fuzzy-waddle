import { Controller, Get, UseGuards } from "@nestjs/common";
import { type CurrentUserProfileDto } from "@fuzzy-waddle/api-interfaces";
import { type AuthUser } from "@supabase/supabase-js";
import { CurrentUser } from "../../auth/current-user";
import { SupabaseAuthGuard } from "../../auth/guards/supabase-auth.guard";
import { UserProfilesService } from "./user-profiles.service";

@Controller("profile")
export class UserProfilesController {
  constructor(private readonly userProfilesService: UserProfilesService) {}

  @Get("me")
  @UseGuards(SupabaseAuthGuard)
  async getCurrentUserProfile(@CurrentUser() user: AuthUser): Promise<CurrentUserProfileDto> {
    return this.userProfilesService.getCurrentUserProfile(user);
  }
}
