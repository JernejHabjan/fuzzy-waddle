import { Test, TestingModule } from "@nestjs/testing";
import { ChatService } from "./chat.service";
import { chatServiceStub } from "./chat.service.stub";
import { ChatController } from "./chat.controller";

describe("ChatController", () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [{ provide: ChatService, useValue: chatServiceStub }]
    }).compile();
  });

  describe("getMessages", () => {
    it("should return empty messages", async () => {
      const controller = app.get(ChatController);
      const result = await controller.getMessages({ limit: 10, offset: 0 });
      expect(result).toEqual({ messages: [], total: 0, hasMore: false });
    });
  });
});
