import { Test, TestingModule } from "@nestjs/testing";
import { FlySquasherController } from "./fly-squasher.controller";
import { FlySquasherService } from "./fly-squasher.service";
import { flySquasherServiceStub } from "./fly-squasher.service.stub";

describe("FlySquasherController", () => {
  let controller: FlySquasherController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: FlySquasherService, useValue: flySquasherServiceStub }],
      controllers: [FlySquasherController]
    }).compile();

    controller = module.get<FlySquasherController>(FlySquasherController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
