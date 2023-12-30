import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { RoomService } from "./room.service";
import { RoomDto } from "./room.dto";
import { CurrentUser } from "../../../auth/current-user";
import { AuthUser } from "@supabase/supabase-js";
import { SupabaseAuthGuard } from "../../../auth/guards/supabase-auth.guard";
import { inject } from "@angular/core";

@Controller("room")
export class RoomController {
  private readonly roomService = inject(RoomService);

  @Post("room")
  @UseGuards(SupabaseAuthGuard)
  async createRoom(@CurrentUser() user: AuthUser, @Body() body: RoomDto): Promise<void> {
    return this.roomService.createRoom(body, user);
  }
}
