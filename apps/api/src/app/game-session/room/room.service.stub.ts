import { AuthUser } from "@supabase/supabase-js";
import { RoomDto } from "./room.dto";
import { IRoomService } from "./room.service.interface";

export const roomServiceStub = {
  createRoom: (body: RoomDto, user: AuthUser) => Promise.resolve()
} satisfies IRoomService;
