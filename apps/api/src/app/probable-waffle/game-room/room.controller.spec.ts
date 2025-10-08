import { Test, TestingModule } from "@nestjs/testing";
import { RoomController } from "./room.controller";
import { RoomService } from "../../game-session/room/room.service";
import { roomServiceStub } from "../../game-session/room/room.service.stub";
import { RoomServerService } from "./room-server.service";
import { roomServerServiceStub } from "./room-server.service.stub";

describe("RoomController", () => {
  let controller: RoomController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomController],
      providers: [
        { provide: RoomService, useValue: roomServiceStub },
        { provide: RoomServerService, useValue: roomServerServiceStub }
      ]
    }).compile();

    controller = module.get<RoomController>(RoomController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
