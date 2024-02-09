import { Test, TestingModule } from "@nestjs/testing";
import { GameInstanceController } from "./game-instance.controller";
import { GameInstanceService } from "./game-instance.service";
import { GameInstanceServiceStub } from "./game-instance.service.spec";

describe("GameInstanceController", () => {
  let controller: GameInstanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: GameInstanceService, useValue: GameInstanceServiceStub }],
      controllers: [GameInstanceController]
    }).compile();

    controller = module.get<GameInstanceController>(GameInstanceController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
