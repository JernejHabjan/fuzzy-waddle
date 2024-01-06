import { Test, TestingModule } from "@nestjs/testing";
import { RoomServerService } from "./room-server.service";
import {
  CommunicatorEvent,
  ProbableWaffleCommunicatorType,
  ProbableWaffleGameInstance,
  ProbableWaffleGetRoomsDto,
  ProbableWaffleRoom,
  RoomAction
} from "@fuzzy-waddle/api-interfaces";
import { User } from "@supabase/supabase-js";
import { RoomServerServiceInterface } from "./room-server.service.interface";
import { RoomGateway } from "./room.gateway";
import { GameInstanceHolderService } from "../game-instance/game-instance-holder.service";

export const roomServerServiceStub = {
  getVisibleRooms(user: User, body: ProbableWaffleGetRoomsDto): Promise<ProbableWaffleRoom[]> {
    return Promise.resolve([]);
  },
  roomEvent(type: RoomAction, gameInstance: ProbableWaffleGameInstance, user: User | null): void {
    //
  },
  emitCertainGameInstanceEventsToAllUsers(
    body: CommunicatorEvent<any, ProbableWaffleCommunicatorType>,
    user: User
  ): void {
    //
  }
} satisfies RoomServerServiceInterface;

describe("RoomServerService", () => {
  let service: RoomServerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomServerService, RoomGateway, GameInstanceHolderService]
    }).compile();

    service = module.get<RoomServerService>(RoomServerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
