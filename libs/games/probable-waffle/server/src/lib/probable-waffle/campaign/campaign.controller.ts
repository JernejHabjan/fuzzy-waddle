import { Body, Controller, Get, Post, Put, UseGuards } from "@nestjs/common";
import type { AuthUser } from "@supabase/supabase-js";
import { CurrentUser } from "@fuzzy-waddle/platform-identity/server/auth/current-user";
import { OnlineAccessGuard } from "@fuzzy-waddle/platform-identity/server/auth/guards/online-access.guard";
import {
  CampaignResultDto,
  MergeCampaignProgressDto,
  StartCampaignRunDto,
  UpdateCampaignProfileDto
} from "./campaign.dto";
import { CampaignServerService } from "./campaign.service";

@Controller("probable-waffle/campaign")
@UseGuards(OnlineAccessGuard)
export class CampaignController {
  constructor(private readonly service: CampaignServerService) {}
  @Get("profile")
  profile(@CurrentUser() user: AuthUser) {
    return this.service.profile(user.id);
  }
  @Get("progress")
  async progress(@CurrentUser() user: AuthUser) {
    const data = await this.service.profile(user.id);
    return { completedMissions: data.completedMissions };
  }
  @Put("profile")
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateCampaignProfileDto) {
    return this.service.updateProfile(user.id, dto.baseProfileRevision, dto.profile);
  }
  @Post("runs")
  start(@CurrentUser() user: AuthUser, @Body() dto: StartCampaignRunDto) {
    return this.service.start(user.id, dto);
  }
  @Post("results")
  result(@CurrentUser() user: AuthUser, @Body() dto: CampaignResultDto) {
    return this.service.result(user.id, dto);
  }
  @Post("merge")
  merge(@CurrentUser() user: AuthUser, @Body() dto: MergeCampaignProgressDto) {
    return this.service.merge(user.id, dto.profile, dto.completedMissions);
  }
}
