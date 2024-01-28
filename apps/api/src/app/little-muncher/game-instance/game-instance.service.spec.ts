import { Test, TestingModule } from "@nestjs/testing";
import { GameInstanceService } from "./game-instance.service";
import {
  GameInstanceDataDto,
  LittleMuncherGameCreateDto,
  LittleMuncherGameInstance,
  LittleMuncherGameInstanceData,
  LittleMuncherRoom,
  LittleMuncherRoomEvent,
  LittleMuncherSpectatorEvent,
  RoomAction,
  SpectatorAction
} from "@fuzzy-waddle/api-interfaces";
import { GameInstanceServiceInterface } from "./game-instance.service.interface";
import { User } from "../../../users/users.service";
import { GameInstanceGateway, GameInstanceGatewayStub } from "./game-instance.gateway";

export const GameInstanceServiceStub = {
  findGameInstance(gameInstanceId: string): LittleMuncherGameInstance | undefined {
    return undefined;
  },
  startGame(body: GameInstanceDataDto, user: User) {
    //
  },
  stopGame(body: GameInstanceDataDto, user: User) {
    //
  },
  getGameInstanceToRoom(gameInstance: LittleMuncherGameInstance): LittleMuncherRoom {
    return undefined;
  },
  getRoomEvent(gameInstance: LittleMuncherGameInstance, action: RoomAction): LittleMuncherRoomEvent {
    return undefined;
  },
  getSpectatorEvent(user: User, room: LittleMuncherRoom, action: SpectatorAction): LittleMuncherSpectatorEvent {
    return undefined;
  },
  getSpectatorRooms(user: User): Promise<LittleMuncherRoom[]> {
    return undefined;
  },
  spectatorJoined(body: GameInstanceDataDto, user: User): Promise<LittleMuncherGameInstanceData> {
    return undefined;
  },
  spectatorLeft(body: GameInstanceDataDto, user: User) {
    //
  },
  startLevel(body: LittleMuncherGameCreateDto, user: User) {
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
