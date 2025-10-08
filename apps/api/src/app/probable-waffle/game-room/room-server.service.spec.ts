import { Test, TestingModule } from "@nestjs/testing";
import { RoomServerService } from "./room-server.service";
import { RoomGateway } from "./room.gateway";
import { GameInstanceHolderService } from "../game-instance/game-instance-holder.service";

describe("RoomServerService", () => {
  let service: RoomServerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomServerService, RoomGateway, GameInstanceHolderService]
    }).compile();

    service = module.get<RoomServerService>(RoomServerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
