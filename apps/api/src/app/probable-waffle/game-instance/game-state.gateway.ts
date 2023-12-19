import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "net";
import { UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../../../auth/guards/supabase-auth.guard";
import { CurrentUser } from "../../../auth/current-user";
import { AuthUser } from "@supabase/supabase-js";
import {
  CommunicatorEvent,
  ProbableWaffleCommunicatorType,
  ProbableWaffleGatewayEvent
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
  @SubscribeMessage(ProbableWaffleGatewayEvent.ProbableWaffleAction)
  async broadcastProbableWaffleAction(
    @CurrentUser() user: AuthUser,
    @MessageBody() payload: CommunicatorEvent<any, ProbableWaffleCommunicatorType>,
    @ConnectedSocket() client: MyConnectedSocket
  ) {
    console.log("broadcasting probable waffle action", payload.communicator);

    const success = this.gameStateServerService.updateGameState(payload, user);
    if (success) {
      client.broadcast.emit(ProbableWaffleGatewayEvent.ProbableWaffleAction, payload);
    } else {
      // 400 error
    }
  }
}
