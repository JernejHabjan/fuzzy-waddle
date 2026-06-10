import { Module } from "@nestjs/common";
import { SupabaseProviderService } from "../../core/supabase-provider/supabase-provider.service";
import { UserProfilesController } from "./user-profiles.controller";
import { UserProfilesService } from "./user-profiles.service";

@Module({
  controllers: [UserProfilesController],
  providers: [UserProfilesService, SupabaseProviderService],
  exports: [UserProfilesService]
})
export class UserProfilesModule {}
