import { Injectable } from "@nestjs/common";
import { SupabaseProviderService } from "../../../core/supabase-provider/supabase-provider.service";
import { AuthUser } from "@supabase/supabase-js";
import { RoomDto } from "./room.dto";
import { IRoomService } from "./room.service.interface";

@Injectable()
export class RoomService implements IRoomService {
  constructor(private readonly supabaseProviderService: SupabaseProviderService) {}

  async createRoom(body: RoomDto, user: AuthUser): Promise<void> {
    const { data, error } = await this.supabaseProviderService.supabaseClient
      .from("rooms")
      .insert({ name: body.roomName, user_id: user.id });
    if (error) {
      console.error(error);
      return Promise.reject(error);
    }
  }
}
