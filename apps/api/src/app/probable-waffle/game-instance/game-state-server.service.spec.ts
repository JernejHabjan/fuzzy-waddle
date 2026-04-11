import { Test, TestingModule } from "@nestjs/testing";
import { GameStateServerService } from "./game-state-server.service";
import { GameInstanceService } from "./game-instance.service";
import { GameInstanceServiceStub } from "./game-instance.service.stub";
import { GameCommandValidatorService } from "./game-command-validator.service";
import { PlayerStateValidatorService } from "./player-state-validator.service";

describe("GameStateServerService", () => {
  let service: GameStateServerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameStateServerService,
        GameCommandValidatorService,
        PlayerStateValidatorService,
        { provide: GameInstanceService, useValue: GameInstanceServiceStub }
      ]
    }).compile();

    service = module.get<GameStateServerService>(GameStateServerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
