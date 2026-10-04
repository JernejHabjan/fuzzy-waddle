import { Module } from "@nestjs/common";
import { FlySquasherController } from "./fly-squasher.controller";
import { FlySquasherService } from "./fly-squasher.service";
import { AuthModule } from "@fuzzy-waddle/platform-identity/server/auth/auth.module";

@Module({
  providers: [FlySquasherService],
  imports: [AuthModule],
  controllers: [FlySquasherController]
})
export class FlySquasherModule {}
