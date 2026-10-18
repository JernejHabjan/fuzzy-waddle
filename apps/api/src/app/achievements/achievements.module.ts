import { Module } from "@nestjs/common";
import { AchievementsController } from "./achievements.controller";
import { AchievementsService } from "./achievements.service";
import { AuthModule } from "@fuzzy-waddle/platform-identity/server/auth/auth.module";

@Module({
  controllers: [AchievementsController],
  imports: [AuthModule],
  providers: [AchievementsService]
})
export class AchievementsModule {}
