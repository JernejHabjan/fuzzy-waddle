import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "net";
import { UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../../../auth/guards/supabase-auth.guard";
import { CurrentUser } from "../../../auth/current-user";
import { AuthUser } from "@supabase/supabase-js";
import {
  CommunicatorEvent,
  LittleMuncherCommunicatorType,
  LittleMuncherGatewayEvent
} from "@fuzzy-waddle/api-interfaces";
import { GameStateServerService } from "./game-state-server.service";

export type MyConnectedSocket = Socket & { broadcast: { emit: (event: string, data: any) => void } };

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",")
  }
})
export class GameStateGateway {
  @WebSocketServer()
  private server: Server;

  constructor(private readonly gameStateServerService: GameStateServerService) {}

  @UseGuards(SupabaseAuthGuard)
  @SubscribeMessage(LittleMuncherGatewayEvent.LittleMuncherAction)
  async broadcastLittleMuncherAction(
    @CurrentUser() user: AuthUser,
    @MessageBody() payload: CommunicatorEvent<any, LittleMuncherCommunicatorType>,
    @ConnectedSocket() client: MyConnectedSocket
  ) {
    console.log("broadcasting little muncher action", payload.communicator);

    const success = this.gameStateServerService.updateGameState(payload, user);
    if (success) {
      client.broadcast.emit(LittleMuncherGatewayEvent.LittleMuncherAction, payload);
    } else {
      // 400 error
    }
  }
}
