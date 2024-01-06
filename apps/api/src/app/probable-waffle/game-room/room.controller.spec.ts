import { Test, TestingModule } from "@nestjs/testing";
import { RoomController } from "./room.controller";
import { RoomService, roomServiceStub } from "../../game-session/room/room.service";
import { RoomServerService } from "./room-server.service";
import { roomServerServiceStub } from "./room-server.service.spec";

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
