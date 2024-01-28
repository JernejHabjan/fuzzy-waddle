import { Test, TestingModule } from "@nestjs/testing";
import { RoomController } from "./room.controller";
import { RoomService, roomServiceStub } from "./room.service";

describe("RoomController", () => {
  let controller: RoomController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomController],
      providers: [{ provide: RoomService, useValue: roomServiceStub }]
    }).compile();

    controller = module.get<RoomController>(RoomController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
