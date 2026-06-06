import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { UseGuards } from "@nestjs/common";
import { OnlineAccessGuard } from "../../../auth/guards/online-access.guard";
import { CurrentUser } from "../../../auth/current-user";
import { type AuthUser } from "@supabase/supabase-js";
import {
  type CommunicatorEvent,
  type LittleMuncherCommunicatorType,
  LittleMuncherGatewayEvent
} from "@fuzzy-waddle/api-interfaces";
import { GameStateServerService } from "./game-state-server.service";
import { Server, Socket } from "socket.io";
import { SocketConnectionAuthService } from "../../../auth/socket-connection-auth.service";

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",")
  }
})
export class GameStateGateway implements OnGatewayConnection {
  @WebSocketServer() private readonly server!: Server;

  constructor(
    private readonly gameStateServerService: GameStateServerService,
    private readonly socketConnectionAuthService: SocketConnectionAuthService
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const authenticated = await this.socketConnectionAuthService.authenticateSocket(client);
    if (!authenticated) {
      client.disconnect(true);
    }
  }

  @UseGuards(OnlineAccessGuard)
  @SubscribeMessage(LittleMuncherGatewayEvent.LittleMuncherAction)
  async broadcastLittleMuncherAction(
    @CurrentUser() user: AuthUser,
    @MessageBody() payload: CommunicatorEvent<any, LittleMuncherCommunicatorType>,
    @ConnectedSocket() socket: Socket
  ) {
    // console.log("Little Muncher - Action", payload.communicator);

    const success = this.gameStateServerService.updateGameState(payload, user);
    if (success) {
      socket.broadcast.emit(LittleMuncherGatewayEvent.LittleMuncherAction, payload);
    } else {
      // 400 error
    }
  }
}
