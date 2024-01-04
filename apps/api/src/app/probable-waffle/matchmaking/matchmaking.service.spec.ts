import { Test, TestingModule } from "@nestjs/testing";
import { MatchmakingService } from "./matchmaking.service";
import { MatchmakingServiceInterface } from "./matchmaking.service.interface";
import { RequestGameSearchForMatchMakingDto } from "@fuzzy-waddle/api-interfaces";
import { User } from "@supabase/supabase-js";
import { GameInstanceService } from "../game-instance/game-instance.service";
import { GameInstanceServiceStub } from "../game-instance/game-instance.service.spec";
import { GameInstanceGateway } from "../game-instance/game-instance.gateway";
import { GameInstanceGatewayStub } from "../../little-muncher/game-instance/game-instance.gateway";

export const matchmakingServiceStub = {
  async requestGameSearchForMatchMaking(body: RequestGameSearchForMatchMakingDto, user: User): Promise<void> {
    return Promise.resolve();
  },
  async stopRequestGameSearchForMatchmaking(user: User): Promise<void> {
    return Promise.resolve();
  }
} satisfies MatchmakingServiceInterface;
describe("MatchmakingService", () => {
  let service: MatchmakingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchmakingService,
        { provide: GameInstanceService, useValue: GameInstanceServiceStub },
        {
          provide: GameInstanceGateway,
          useValue: GameInstanceGatewayStub
        }
      ]
    }).compile();

    service = module.get<MatchmakingService>(MatchmakingService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
