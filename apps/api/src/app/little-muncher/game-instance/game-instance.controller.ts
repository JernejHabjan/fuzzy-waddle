import { Body, Controller, Delete, Get, Post, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../../../auth/guards/supabase-auth.guard";
import { CurrentUser } from "../../../auth/current-user";
import { AuthUser } from "@supabase/supabase-js";
import { GameInstanceService } from "./game-instance.service";
import {
  GameInstanceDataDto,
  LittleMuncherGameCreateDto,
  LittleMuncherGameInstanceData,
  LittleMuncherRoom
} from "@fuzzy-waddle/api-interfaces";
import { inject } from "@angular/core";

@Controller("little-muncher")
export class GameInstanceController {
  private readonly gameInstanceService = inject(GameInstanceService);

  @Post("start-game")
  @UseGuards(SupabaseAuthGuard)
  async startGame(@CurrentUser() user: AuthUser, @Body() body: GameInstanceDataDto): Promise<void> {
    await this.gameInstanceService.startGame(body, user);
  }

  @Delete("stop-game")
  @UseGuards(SupabaseAuthGuard)
  async stopGame(@CurrentUser() user: AuthUser, @Body() body: GameInstanceDataDto): Promise<void> {
    await this.gameInstanceService.stopGame(body, user);
  }

  @Post("start-level")
  @UseGuards(SupabaseAuthGuard)
  async createGameMode(@CurrentUser() user: AuthUser, @Body() body: LittleMuncherGameCreateDto): Promise<void> {
    await this.gameInstanceService.startLevel(body, user);
  }

  @Delete("stop-level")
  @UseGuards(SupabaseAuthGuard)
  async deleteGameMode(@CurrentUser() user: AuthUser, @Body() body: GameInstanceDataDto): Promise<void> {
    await this.gameInstanceService.stopLevel(body, user);
  }

  @Post("spectator-join")
  @UseGuards(SupabaseAuthGuard)
  async spectatorJoin(
    @CurrentUser() user: AuthUser,
    @Body() body: GameInstanceDataDto
  ): Promise<LittleMuncherGameInstanceData> {
    return await this.gameInstanceService.spectatorJoined(body, user);
  }

  @Delete("spectator-leave")
  @UseGuards(SupabaseAuthGuard)
  async spectatorLeave(@CurrentUser() user: AuthUser, @Body() body: GameInstanceDataDto): Promise<void> {
    await this.gameInstanceService.spectatorLeft(body, user);
  }

  @Get("get-rooms")
  @UseGuards(SupabaseAuthGuard)
  async getRooms(@CurrentUser() user: AuthUser): Promise<LittleMuncherRoom[]> {
    return await this.gameInstanceService.getSpectatorRooms(user);
  }
}
