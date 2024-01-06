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
  getGameInstanceData(gameInstanceId: string): ProbableWaffleGameInstanceData | null {
    return null;
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
