import { Test, TestingModule } from "@nestjs/testing";
import { GameInstanceService } from "./game-instance.service";
import {
  GameInstanceDataDto,
  ProbableWaffleAddPlayerDto,
  ProbableWaffleAddSpectatorDto,
  ProbableWaffleChangeGameModeDto,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceMetadataData,
  ProbableWafflePlayerLeftDto,
  ProbableWaffleStartLevelDto
} from "@fuzzy-waddle/api-interfaces";
import { GameInstanceServiceInterface } from "./game-instance.service.interface";
import { User } from "../../../users/users.service";
import { GameInstanceGateway } from "./game-instance.gateway";
import { TextSanitizationService } from "../../../core/content-filters/text-sanitization.service";
import { GameInstanceGatewayStub } from "../../little-muncher/game-instance/game-instance.gateway";

export const GameInstanceServiceStub = {
  findGameInstance(gameInstanceId: string): ProbableWaffleGameInstance | undefined {
    return undefined;
  },
  createGameInstance(gameInstanceMetadataData: ProbableWaffleGameInstanceMetadataData, user: User) {
    //
  },
  getPlayerColorForNewPlayer(gameInstance: ProbableWaffleGameInstance): string {
    return "hsl(0, 0%, 0%)";
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
  },
  async stopGameInstance(gameInstanceId: string, user: User) {
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
