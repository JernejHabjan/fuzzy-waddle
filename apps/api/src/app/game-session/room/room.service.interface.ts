import { RoomDto } from "./room.dto";
import { type AuthUser } from "@supabase/supabase-js";

export interface IRoomService {
  createRoom(body: RoomDto, user: AuthUser): Promise<void>;
}
