import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import type { AuthUser } from "@supabase/supabase-js";
import { CurrentUser } from "../../../auth/current-user";
import { OnlineAccessGuard } from "../../../auth/guards/online-access.guard";
import { CampaignResultDto, StartCampaignRunDto } from "./campaign.dto";
import { CampaignServerService } from "./campaign.service";

@Controller("probable-waffle/campaign")
@UseGuards(OnlineAccessGuard)
export class CampaignController {
  constructor(private readonly service: CampaignServerService) {}
  @Get("progress") progress(@CurrentUser() user: AuthUser) {
    return this.service.progress(user.id);
  }
  @Post("runs") start(@CurrentUser() user: AuthUser, @Body() dto: StartCampaignRunDto) {
    return this.service.start(user.id, dto.runId, dto.missionId);
  }
  @Post("results") result(@CurrentUser() user: AuthUser, @Body() dto: CampaignResultDto) {
    return this.service.result(user.id, dto);
  }
}
