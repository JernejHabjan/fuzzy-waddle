import { Test, TestingModule } from "@nestjs/testing";
import { GameInstanceService } from "./game-instance.service";
import {
  GameInstanceDataDto,
  ProbableWaffleGameCreateDto,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  Room,
  RoomAction,
  RoomEvent,
  SpectatorAction,
  SpectatorEvent
} from "@fuzzy-waddle/api-interfaces";
import { GameInstanceServiceInterface } from "./game-instance.service.interface";
import { User } from "../../../users/users.service";
import { GameInstanceGateway, GameInstanceGatewayStub } from "./game-instance.gateway";

export const GameInstanceServiceStub = {
  findGameInstance(gameInstanceId: string): ProbableWaffleGameInstance | undefined {
    return undefined;
  },
  startGame(body: GameInstanceDataDto, user: User) {
    //
  },
  stopGame(body: GameInstanceDataDto, user: User) {
    //
  },
  getGameInstanceToRoom(gameInstance: ProbableWaffleGameInstance): Room {
    return undefined;
  },
  getRoomEvent(gameInstance: ProbableWaffleGameInstance, action: RoomAction): RoomEvent {
    return undefined;
  },
  getSpectatorEvent(user: User, room: Room, action: SpectatorAction): SpectatorEvent {
    return undefined;
  },
  getSpectatorRooms(user: User): Promise<Room[]> {
    return undefined;
  },
  spectatorJoined(body: GameInstanceDataDto, user: User): Promise<ProbableWaffleGameInstanceData> {
    return undefined;
  },
  spectatorLeft(body: GameInstanceDataDto, user: User) {
    //
  },
  startLevel(body: ProbableWaffleGameCreateDto, user: User) {
    //
  },
  stopLevel(body: GameInstanceDataDto, user: User) {
    //
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
