import { Test, TestingModule } from "@nestjs/testing";
import { ChatService } from "./chat.service";
import { chatServiceStub } from "./chat.service.stub";
import { ChatController } from "./chat.controller";
import { MessageDto } from "./message.dto";
import { authUserStub } from "../../auth/auth.service.stub";

describe("ChatController", () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [{ provide: ChatService, useValue: chatServiceStub }]
    }).compile();
  });

  describe("postMessage", () => {
    it("should return void", async () => {
      const chatController = app.get<ChatController>(ChatController);
      const user = authUserStub;
      const messageDto: MessageDto = { message: "test" };
      const result = await chatController.postMessage(user, messageDto);
      expect(result).toBeUndefined();
    });
  });
});
