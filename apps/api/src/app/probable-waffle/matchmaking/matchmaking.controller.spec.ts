import { Test, TestingModule } from "@nestjs/testing";
import { MatchmakingController } from "./matchmaking.controller";
import { MatchmakingService } from "./matchmaking.service";
import { matchmakingServiceStub } from "./matchmaking.service.stub";

describe("MatchmakingController", () => {
  let controller: MatchmakingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchmakingController],
      providers: [{ provide: MatchmakingService, useValue: matchmakingServiceStub }]
    }).compile();

    controller = module.get<MatchmakingController>(MatchmakingController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
