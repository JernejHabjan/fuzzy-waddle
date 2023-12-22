import { Test, TestingModule } from "@nestjs/testing";
import { GameInstanceService } from "./game-instance.service";
import {
  GameInstanceDataDto,
  ProbableWaffleStartLevelDto,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleRoom,
  RoomAction,
  ProbableWaffleRoomEvent,
  SpectatorAction,
  ProbableWaffleSpectatorEvent
} from "@fuzzy-waddle/api-interfaces";
import { GameInstanceServiceInterface } from "./game-instance.service.interface";
import { User } from "../../../users/users.service";
import { GameInstanceGateway, GameInstanceGatewayStub } from "./game-instance.gateway";

export const GameInstanceServiceStub = {
  findGameInstance(gameInstanceId: string): ProbableWaffleGameInstance | undefined {
    return undefined;
  },
  createGameInstance(body: GameInstanceDataDto, user: User) {
    //
  },
  stopGameInstance(body: GameInstanceDataDto, user: User) {
    //
  },
  getGameInstanceToRoom(gameInstance: ProbableWaffleGameInstance): ProbableWaffleRoom {
    return undefined;
  },
  getRoomEvent(gameInstance: ProbableWaffleGameInstance, action: RoomAction): ProbableWaffleRoomEvent {
    return undefined;
  },
  getSpectatorEvent(user: User, gameInstanceId: string, action: SpectatorAction): ProbableWaffleSpectatorEvent {
    return undefined;
  },
  getJoinableRooms(user: User): Promise<ProbableWaffleRoom[]> {
    return undefined;
  },
  joinRoom(body: GameInstanceDataDto, user: User): Promise<ProbableWaffleGameInstanceData> {
    return undefined;
  },
  leaveRoom(body: GameInstanceDataDto, user: User) {
    //
  },
  startLevel(body: ProbableWaffleStartLevelDto, user: User) {
    //
  },
  stopLevel(body: GameInstanceDataDto, user: User) {
    //
  },
  getPlayerEvent(user: User, player: any, gameInstanceId: string, action: any): ProbableWaffleSpectatorEvent {
    return undefined;
  }
} satisfies GameInstanceServiceInterface;

describe("GameInstanceService", () => {
  let service: GameInstanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameInstanceService,
        {
          provide: GameInstanceGateway,
          useValue: GameInstanceGatewayStub
        }
      ]
    }).compile();

    service = module.get<GameInstanceService>(GameInstanceService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
