import { Body, Controller, Delete, Get, Post, UseGuards } from "@nestjs/common";
import { OnlineAccessGuard } from "../../../auth/guards/online-access.guard";
import { CurrentUser } from "../../../auth/current-user";
import { type AuthUser } from "@supabase/supabase-js";
import { GameInstanceService } from "./game-instance.service";
import {
  type GameInstanceDataDto,
  type LittleMuncherGameCreateDto,
  type LittleMuncherGameInstanceData,
  type LittleMuncherRoom,
  LittleMuncherScoreDto
} from "@fuzzy-waddle/api-interfaces";
import { LittleMuncherHighScoreService } from "../high-score/little-muncher-high-score.service";

@Controller("little-muncher")
export class GameInstanceController {
  constructor(
    private readonly gameInstanceService: GameInstanceService,
    private readonly highScoreService: LittleMuncherHighScoreService
  ) {}

  @Post("start-game")
  @UseGuards(OnlineAccessGuard)
  async startGame(@CurrentUser() user: AuthUser, @Body() body: GameInstanceDataDto): Promise<void> {
    await this.gameInstanceService.startGame(body, user);
  }

  @Delete("stop-game")
  @UseGuards(OnlineAccessGuard)
  async stopGame(@CurrentUser() user: AuthUser, @Body() body: GameInstanceDataDto): Promise<void> {
    await this.gameInstanceService.stopGame(body, user);
  }

  @Post("start-level")
  @UseGuards(OnlineAccessGuard)
  async createGameMode(@CurrentUser() user: AuthUser, @Body() body: LittleMuncherGameCreateDto): Promise<void> {
    await this.gameInstanceService.startLevel(body, user);
  }

  @Delete("stop-level")
  @UseGuards(OnlineAccessGuard)
  async deleteGameMode(@CurrentUser() user: AuthUser, @Body() body: GameInstanceDataDto): Promise<void> {
    await this.gameInstanceService.stopLevel(body, user);
  }

  @Post("spectator-join")
  @UseGuards(OnlineAccessGuard)
  async spectatorJoin(
    @CurrentUser() user: AuthUser,
    @Body() body: GameInstanceDataDto
  ): Promise<LittleMuncherGameInstanceData> {
    return await this.gameInstanceService.spectatorJoined(body, user);
  }

  @Delete("spectator-leave")
  @UseGuards(OnlineAccessGuard)
  async spectatorLeave(@CurrentUser() user: AuthUser, @Body() body: GameInstanceDataDto): Promise<void> {
    await this.gameInstanceService.spectatorLeft(body, user);
  }

  @Get("get-rooms")
  @UseGuards(OnlineAccessGuard)
  async getRooms(@CurrentUser() user: AuthUser): Promise<LittleMuncherRoom[]> {
    return this.gameInstanceService.getSpectatorRooms(user);
  }

  /**
   * The score is posted when a player finishes a level.
   * It is posted from FE, but as that is ofc not secure, we currently do not serve game logic on BE.
   */
  @Post("post-score")
  @UseGuards(OnlineAccessGuard)
  async postScore(@CurrentUser() user: AuthUser, @Body() body: LittleMuncherScoreDto): Promise<void> {
    await this.highScoreService.postScore(body, user);
  }

  @Get("get-scores")
  async getScores(): Promise<LittleMuncherScoreDto[]> {
    return this.highScoreService.getScores();
  }
}
