import { Module } from "@nestjs/common";
import { AchievementsController } from "./achievements.controller";
import { AchievementsService } from "./achievements.service";
import { AuthModule } from "../../auth/auth.module";

@Module({
  controllers: [AchievementsController],
  imports: [AuthModule],
  providers: [AchievementsService]
})
export class AchievementsModule {}
