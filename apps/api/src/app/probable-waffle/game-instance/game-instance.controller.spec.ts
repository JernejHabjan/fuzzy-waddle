import { Test, TestingModule } from "@nestjs/testing";
import { GameInstanceController } from "./game-instance.controller";
import { GameInstanceService } from "./game-instance.service";
import { GameInstanceServiceStub } from "./game-instance.service.stub";
import { MatchmakingService } from "../matchmaking/matchmaking.service";
import { matchmakingServiceStub } from "../matchmaking/matchmaking.service.stub";

describe("GameInstanceController", () => {
  let controller: GameInstanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: GameInstanceService, useValue: GameInstanceServiceStub },
        { provide: MatchmakingService, useValue: matchmakingServiceStub }
      ],
      controllers: [GameInstanceController]
    }).compile();

    controller = module.get<GameInstanceController>(GameInstanceController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
