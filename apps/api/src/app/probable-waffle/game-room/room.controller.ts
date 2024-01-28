import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../../../auth/guards/supabase-auth.guard";
import { CurrentUser } from "../../../auth/current-user";
import { AuthUser } from "@supabase/supabase-js";
import { ProbableWaffleGetRoomsDto, ProbableWaffleRoom } from "@fuzzy-waddle/api-interfaces";
import { RoomServerService } from "./room-server.service";

@Controller("probable-waffle")
export class RoomController {
  constructor(private readonly roomServerService: RoomServerService) {}

  // @Post("join-room")
  // @UseGuards(SupabaseAuthGuard)
  // async joinRoom(
  //   @CurrentUser() user: AuthUser,
  //   @Body() body: ProbableWaffleJoinDto
  // ): Promise<ProbableWaffleGameInstanceData> {
  //   return await this.roomServerService.joinRoom(body, user);
  // }

  @Post("get-rooms")
  @UseGuards(SupabaseAuthGuard)
  async getRooms(
    @CurrentUser() user: AuthUser,
    @Body() body: ProbableWaffleGetRoomsDto
  ): Promise<ProbableWaffleRoom[]> {
    return await this.roomServerService.getVisibleRooms(user, body);
  }
}
