import { Test, TestingModule } from "@nestjs/testing";
import { MatchmakingService } from "./matchmaking.service";
import { GameInstanceService } from "../game-instance/game-instance.service";
import { GameInstanceGateway } from "../game-instance/game-instance.gateway";
import { GameInstanceGatewayStub } from "../game-instance/game-instance.gateway.stub";
import { RoomServerService } from "../game-room/room-server.service";
import { GameInstanceServiceStub } from "../game-instance/game-instance.service.stub";
import { roomServerServiceStub } from "../game-room/room-server.service.stub";
import { GameSessionService } from "../game-session/game-session.service";
import { gameSessionServiceStub } from "../game-session/game-session.service.stub";
import { ProbableWaffleMapEnum } from "@fuzzy-waddle/probable-waffle-protocol";
import { BadRequestException } from "@nestjs/common";
import type { User } from "@supabase/supabase-js";

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
        },
        {
          provide: RoomServerService,
          useValue: roomServerServiceStub
        },
        {
          provide: GameSessionService,
          useValue: gameSessionServiceStub
        }
      ]
    }).compile();

    service = module.get<MatchmakingService>(MatchmakingService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("rejects test-only maps before opening or joining a public matchmaking game", async () => {
    await expect(service.requestGameSearchForMatchMaking({
      mapPoolIds: [ProbableWaffleMapEnum.AiOpenEconomy], factionType: null
    }, {} as User)).rejects.toBeInstanceOf(BadRequestException);
  });
});
