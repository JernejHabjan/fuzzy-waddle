import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../../../auth/guards/supabase-auth.guard";
import { CurrentUser } from "../../../auth/current-user";
import { type AuthUser } from "@supabase/supabase-js";
import {
  type CommunicatorEvent,
  type LittleMuncherCommunicatorType,
  LittleMuncherGatewayEvent
} from "@fuzzy-waddle/api-interfaces";
import { GameStateServerService } from "./game-state-server.service";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",")
  }
})
export class GameStateGateway {
  @WebSocketServer() private readonly server!: Server;

  constructor(private readonly gameStateServerService: GameStateServerService) {}

  @UseGuards(SupabaseAuthGuard)
  @SubscribeMessage(LittleMuncherGatewayEvent.LittleMuncherAction)
  async broadcastLittleMuncherAction(
    @CurrentUser() user: AuthUser,
    @MessageBody() payload: CommunicatorEvent<any, LittleMuncherCommunicatorType>,
    @ConnectedSocket() socket: Socket
  ) {
    console.log("Little Muncher - Action", payload.communicator);

    const success = this.gameStateServerService.updateGameState(payload, user);
    if (success) {
      socket.broadcast.emit(LittleMuncherGatewayEvent.LittleMuncherAction, payload);
    } else {
      // 400 error
    }
  }
}
