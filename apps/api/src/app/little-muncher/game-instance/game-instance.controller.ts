import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../../../auth/current-user';
import { AuthUser } from '@supabase/supabase-js';
import { GameInstanceService } from './game-instance.service';
import {
  LittleMuncherGameInstanceCreateDto,
  LittleMuncherGameModeCreateDto,
  SpectatorRoom
} from '@fuzzy-waddle/api-interfaces';

@Controller('little-muncher')
export class GameInstanceController {
  constructor(private readonly gameInstanceService: GameInstanceService) {}

  @Post('create-game-instance')
  @UseGuards(SupabaseAuthGuard)
  async createGameInstance(
    @CurrentUser() user: AuthUser,
    @Body() body: LittleMuncherGameInstanceCreateDto
  ): Promise<void> {
    await this.gameInstanceService.create(body, user);
  }

  @Delete('destroy-game-instance')
  @UseGuards(SupabaseAuthGuard)
  async deleteGameInstance(
    @CurrentUser() user: AuthUser,
    @Body() body: LittleMuncherGameInstanceCreateDto
  ): Promise<void> {
    await this.gameInstanceService.delete(body, user);
  }

  @Post('create-game-mode')
  @UseGuards(SupabaseAuthGuard)
  async createGameMode(@CurrentUser() user: AuthUser, @Body() body: LittleMuncherGameModeCreateDto): Promise<void> {
    await this.gameInstanceService.setGameMode(body, user);
  }

  @Delete('destroy-game-mode')
  @UseGuards(SupabaseAuthGuard)
  async deleteGameMode(@CurrentUser() user: AuthUser, @Body() body: LittleMuncherGameModeCreateDto): Promise<void> {
    await this.gameInstanceService.deleteGameMode(body, user);
  }

  @Get('get-spectator-rooms')
  @UseGuards(SupabaseAuthGuard)
  async getSpectatorRooms(@CurrentUser() user: AuthUser): Promise<SpectatorRoom[]> {
    return await this.gameInstanceService.getSpectatorRooms(user);
  }
}
