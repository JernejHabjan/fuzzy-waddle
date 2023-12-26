import { Body, Controller, Delete, Get, Post, Put, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../../../auth/guards/supabase-auth.guard";
import { CurrentUser } from "../../../auth/current-user";
import { AuthUser } from "@supabase/supabase-js";
import { GameInstanceService } from "./game-instance.service";
import {
  GameInstanceDataDto,
  ProbableWaffleStartLevelDto,
  ProbableWaffleGameInstanceData,
  ProbableWaffleRoom,
  ProbableWaffleGameInstanceDataDto,
  ProbableWaffleJoinDto,
  ProbableWaffleGetRoomsDto,
  ProbableWaffleChangeGameModeDto,
  ProbableWaffleAddPlayerDto,
  ProbableWafflePlayerLeftDto,
  ProbableWaffleAddSpectatorDto
} from "@fuzzy-waddle/api-interfaces";

@Controller("probable-waffle")
export class GameInstanceController {
  constructor(private readonly gameInstanceService: GameInstanceService) {}

  @Post("start-game")
  @UseGuards(SupabaseAuthGuard)
  async startGame(@CurrentUser() user: AuthUser, @Body() body: ProbableWaffleGameInstanceDataDto): Promise<void> {
    await this.gameInstanceService.createGameInstance(body, user);
  }

  @Delete("stop-game")
  @UseGuards(SupabaseAuthGuard)
  async stopGame(@CurrentUser() user: AuthUser, @Body() body: GameInstanceDataDto): Promise<void> {
    await this.gameInstanceService.stopGameInstance(body, user);
  }

  @Post("start-level")
  @UseGuards(SupabaseAuthGuard)
  async startLevel(@CurrentUser() user: AuthUser, @Body() body: ProbableWaffleStartLevelDto): Promise<void> {
    await this.gameInstanceService.startLevel(body, user);
  }

  @Delete("stop-level")
  @UseGuards(SupabaseAuthGuard)
  async stopLevel(@CurrentUser() user: AuthUser, @Body() body: GameInstanceDataDto): Promise<void> {
    await this.gameInstanceService.stopLevel(body, user);
  }

  @Post("join-room")
  @UseGuards(SupabaseAuthGuard)
  async joinRoom(
    @CurrentUser() user: AuthUser,
    @Body() body: ProbableWaffleJoinDto
  ): Promise<ProbableWaffleGameInstanceData> {
    return await this.gameInstanceService.joinRoom(body, user);
  }

  @Delete("leave-room")
  @UseGuards(SupabaseAuthGuard)
  async leaveRoom(@CurrentUser() user: AuthUser, @Body() body: GameInstanceDataDto): Promise<void> {
    await this.gameInstanceService.leaveRoom(body, user);
  }

  @Post("get-rooms")
  @UseGuards(SupabaseAuthGuard)
  async getRooms(
    @CurrentUser() user: AuthUser,
    @Body() body: ProbableWaffleGetRoomsDto
  ): Promise<ProbableWaffleRoom[]> {
    return await this.gameInstanceService.getJoinableRooms(user, body);
  }

  @Put("change-game-mode")
  @UseGuards(SupabaseAuthGuard)
  async changeGameMode(@CurrentUser() user: AuthUser, @Body() body: ProbableWaffleChangeGameModeDto): Promise<void> {
    await this.gameInstanceService.changeGameMode(user, body);
  }

  @Post("open-player-slot")
  @UseGuards(SupabaseAuthGuard)
  async openPlayerSlot(@CurrentUser() user: AuthUser, @Body() body: ProbableWaffleAddPlayerDto): Promise<void> {
    await this.gameInstanceService.openPlayerSlot(body, user);
  }

  @Post("player-left")
  @UseGuards(SupabaseAuthGuard)
  async playerLeft(@CurrentUser() user: AuthUser, @Body() body: ProbableWafflePlayerLeftDto): Promise<void> {
    await this.gameInstanceService.playerLeft(body, user);
  }

  @Post("add-player")
  @UseGuards(SupabaseAuthGuard)
  async addPlayer(@CurrentUser() user: AuthUser, @Body() body: ProbableWaffleAddPlayerDto): Promise<void> {
    await this.gameInstanceService.addPlayer(body, user);
  }

  @Post("add-spectator")
  @UseGuards(SupabaseAuthGuard)
  async addSpectator(@CurrentUser() user: AuthUser, @Body() body: ProbableWaffleAddSpectatorDto): Promise<void> {
    await this.gameInstanceService.addSpectator(body, user);
  }
}
