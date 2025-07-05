import { Test, TestingModule } from "@nestjs/testing";
import { MatchmakingService } from "./matchmaking.service";
import { GameInstanceService } from "../game-instance/game-instance.service";
import { GameInstanceGateway } from "../game-instance/game-instance.gateway";
import { GameInstanceGatewayStub } from "../../little-muncher/game-instance/game-instance.gateway";
import { RoomServerService } from "../game-room/room-server.service";
import { GameInstanceServiceStub } from "../game-instance/game-instance.service.stub";
import { roomServerServiceStub } from "../game-room/room-server.service.stub";

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
        }
      ]
    }).compile();

    service = module.get<MatchmakingService>(MatchmakingService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
