import { Test, TestingModule } from "@nestjs/testing";
import { RoomServerService } from "./room-server.service";
import { RoomGateway } from "./room.gateway";
import { GameInstanceHolderService } from "../game-instance/game-instance-holder.service";
import { roomGatewayStub } from "./room.gateway.stub";
import { gameInstanceHolderServiceStub } from "../game-instance/game-instance-holder.service.stub";

describe("RoomServerService", () => {
  let service: RoomServerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomServerService,
        { provide: RoomGateway, useValue: roomGatewayStub },
        { provide: GameInstanceHolderService, useValue: gameInstanceHolderServiceStub }
      ]
    }).compile();

    service = module.get<RoomServerService>(RoomServerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
