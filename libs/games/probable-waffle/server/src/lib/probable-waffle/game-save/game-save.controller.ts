import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import type { AuthUser } from "@supabase/supabase-js";
import { CurrentUser } from "@fuzzy-waddle/platform-identity/server/auth/current-user";
import { OnlineAccessGuard } from "@fuzzy-waddle/platform-identity/server/auth/guards/online-access.guard";
import { SyncGameSaveDto } from "./game-save.dto";
import { GameSaveServerService } from "./game-save.service";

@Controller("probable-waffle/game-saves")
@UseGuards(OnlineAccessGuard)
export class GameSaveController {
  constructor(private readonly gameSaveService: GameSaveServerService) {}
  @Get() list(@CurrentUser() user: AuthUser) {
    return this.gameSaveService.list(user.id);
  }
  // encodedGameInstanceData carries the full serialized game/campaign runtime state, so this
  // request body can easily exceed Express/body-parser's default 100kb limit. The API raises the
  // global JSON body-size limit for this in apps/api/src/main.ts (app.useBodyParser); keep that
  // limit in mind (or bump it) if save payloads grow further.
  @Post() sync(@CurrentUser() user: AuthUser, @Body() dto: SyncGameSaveDto) {
    return this.gameSaveService.upsert(user.id, dto);
  }
}
