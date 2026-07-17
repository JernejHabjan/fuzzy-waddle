import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import type { AuthUser } from "@supabase/supabase-js";
import { CurrentUser } from "../../../auth/current-user";
import { OnlineAccessGuard } from "../../../auth/guards/online-access.guard";
import { SyncGameSaveDto } from "./game-save.dto";
import { GameSaveServerService } from "./game-save.service";

@Controller("probable-waffle/game-saves")
@UseGuards(OnlineAccessGuard)
export class GameSaveController {
  constructor(private readonly gameSaveService: GameSaveServerService) {}
  @Get() list(@CurrentUser() user: AuthUser) {
    return this.gameSaveService.list(user.id);
  }
  @Post() sync(@CurrentUser() user: AuthUser, @Body() dto: SyncGameSaveDto) {
    return this.gameSaveService.upsert(user.id, dto);
  }
}
