import { type AuthUser } from "@supabase/supabase-js";
import { RoomDto } from "./room.dto";
import { type IRoomService } from "./room.service.interface";

export const roomServiceStub = {
  createRoom: (body: RoomDto, user: AuthUser) => Promise.resolve()
} satisfies IRoomService;
