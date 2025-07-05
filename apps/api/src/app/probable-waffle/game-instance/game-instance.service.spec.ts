import { Test, TestingModule } from "@nestjs/testing";
import { GameInstanceService } from "./game-instance.service";
import { GameInstanceGateway } from "./game-instance.gateway";
import { TextSanitizationService } from "../../../core/content-filters/text-sanitization.service";
import { GameInstanceGatewayStub } from "../../little-muncher/game-instance/game-instance.gateway";
import { RoomServerService } from "../game-room/room-server.service";
import { roomServerServiceStub } from "../game-room/room-server.service.stub";
import { GameInstanceHolderService } from "./game-instance-holder.service";

describe("GameInstanceService", () => {
  let service: GameInstanceService;

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
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
