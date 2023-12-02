import { Module } from "@nestjs/common";
import { FlySquasherController } from "./fly-squasher.controller";
import { FlySquasherService } from "./fly-squasher.service";
import { SupabaseProviderService } from "../../core/supabase-provider/supabase-provider.service";

@Module({
  providers: [SupabaseProviderService, FlySquasherService],
  controllers: [FlySquasherController]
})
export class FlySquasherModule {}
