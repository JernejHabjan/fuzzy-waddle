import { Test, TestingModule } from "@nestjs/testing";
import { GameInstanceService } from "./game-instance.service";
import {
  GameInstanceDataDto,
  PlayerAction,
  PlayerLobbyDefinition,
  ProbableWaffleAddPlayerDto,
  ProbableWaffleAddSpectatorDto,
  ProbableWaffleChangeGameModeDto,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceMetadataData,
  ProbableWafflePlayer,
  ProbableWafflePlayerEvent,
  ProbableWafflePlayerLeftDto,
  ProbableWaffleRoom,
  ProbableWaffleRoomEvent,
  ProbableWaffleSpectator,
  ProbableWaffleSpectatorEvent,
  ProbableWaffleStartLevelDto,
  RoomAction,
  SpectatorAction
} from "@fuzzy-waddle/api-interfaces";
import { GameInstanceServiceInterface } from "./game-instance.service.interface";
import { User } from "../../../users/users.service";
import { GameInstanceGateway, GameInstanceGatewayStub } from "./game-instance.gateway";
import { TextSanitizationService } from "../../../core/content-filters/text-sanitization.service";

export const GameInstanceServiceStub = {
  addGameInstance(gameInstance: ProbableWaffleGameInstance): void {
    //
  },
  findGameInstance(gameInstanceId: string): ProbableWaffleGameInstance | undefined {
    return undefined;
  },
  createGameInstance(gameInstanceMetadataData: ProbableWaffleGameInstanceMetadataData, user: User) {
    //
  },
  getPlayerColorForNewPlayer(gameInstance: ProbableWaffleGameInstance): string {
    return "hsl(0, 0%, 0%)";
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
  getPlayerLobbyDefinitionForNewPlayer(gameInstance: ProbableWaffleGameInstance): PlayerLobbyDefinition {
    return undefined;
  },
  getSpectatorEvent(
    spectator: ProbableWaffleSpectator,
    gameInstanceId: string,
    action: SpectatorAction
  ): ProbableWaffleSpectatorEvent {
    return undefined;
  },
  getVisibleRooms(user: User): Promise<ProbableWaffleRoom[]> {
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
  getPlayerEvent(
    player: ProbableWafflePlayer,
    gameInstanceId: string,
    action: PlayerAction
  ): ProbableWafflePlayerEvent {
    return undefined;
  },
  async changeGameMode(user: User, body: ProbableWaffleChangeGameModeDto): Promise<void> {
    return undefined;
  },
  async openPlayerSlot(body: ProbableWaffleAddPlayerDto, user: User): Promise<void> {
    return undefined;
  },
  async playerLeft(body: ProbableWafflePlayerLeftDto, user: User): Promise<void> {
    return undefined;
  },
  async addPlayer(body: ProbableWaffleAddPlayerDto, user: User): Promise<void> {
    return undefined;
  },
  async addSpectator(body: ProbableWaffleAddSpectatorDto, user: User): Promise<void> {
    return undefined;
  },
  async getGameInstance(gameInstanceId: string, user: User): Promise<ProbableWaffleGameInstanceData | null> {
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
        },
        TextSanitizationService
      ]
    }).compile();

    service = module.get<GameInstanceService>(GameInstanceService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
