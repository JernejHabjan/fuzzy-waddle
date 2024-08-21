import { Test, TestingModule } from "@nestjs/testing";
import { GameInstanceHolderService } from "./game-instance-holder.service";

describe("GameInstanceHolderService", () => {
  let service: GameInstanceHolderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameInstanceHolderService]
    }).compile();

    service = module.get<GameInstanceHolderService>(GameInstanceHolderService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
