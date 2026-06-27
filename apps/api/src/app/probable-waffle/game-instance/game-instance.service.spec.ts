import { Test, TestingModule } from "@nestjs/testing";
import { GameInstanceService } from "./game-instance.service";
import { GameInstanceGateway } from "./game-instance.gateway";
import { TextSanitizationService } from "../../../core/content-filters/text-sanitization.service";
import { GameInstanceGatewayStub } from "../../little-muncher/game-instance/game-instance.gateway.stub";
import { RoomServerService } from "../game-room/room-server.service";
import { roomServerServiceStub } from "../game-room/room-server.service.stub";
import { GameInstanceHolderService } from "./game-instance-holder.service";

describe("GameInstanceService", () => {
  let service: GameInstanceService;
  let holder: GameInstanceHolderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameInstanceHolderService,
        GameInstanceService,
        {
          provide: GameInstanceGateway,
          useValue: GameInstanceGatewayStub
        },
        {
          provide: RoomServerService,
          useValue: roomServerServiceStub
        },
        TextSanitizationService
      ]
    }).compile();

    service = module.get<GameInstanceService>(GameInstanceService);
    holder = module.get<GameInstanceHolderService>(GameInstanceHolderService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("allows the migrated host to stop the game instance", () => {
    const gameInstance = {
      gameInstanceMetadata: {
        data: {
          gameInstanceId: "game-1"
        }
      },
      isHost: jest.fn((userId: string) => userId === "host-2")
    } as any;
    holder.addGameInstance(gameInstance);

    service.stopGameInstance("game-1" as any, { id: "host-2" } as any);

    expect(holder.findGameInstance("game-1" as any)).toBeUndefined();
  });
});
