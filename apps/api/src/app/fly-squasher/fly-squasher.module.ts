import { Module } from "@nestjs/common";
import { FlySquasherController } from "./fly-squasher.controller";
import { FlySquasherService } from "./fly-squasher.service";
import { AuthModule } from "../../auth/auth.module";

@Module({
  providers: [FlySquasherService],
  imports: [AuthModule],
  controllers: [FlySquasherController]
})
export class FlySquasherModule {}
