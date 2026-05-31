import { Test, TestingModule } from "@nestjs/testing";
import { ChatService } from "./chat.service";
import { chatServiceStub } from "./chat.service.stub";
import { ChatController } from "./chat.controller";
import { ChatReportReason } from "@fuzzy-waddle/api-interfaces";
import type { AuthUser } from "@supabase/supabase-js";

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

  describe("reportMessage", () => {
    it("should report a message for the current user", async () => {
      const controller = app.get(ChatController);
      const chatService = app.get(ChatService);
      const reportSpy = jest.spyOn(chatService, "reportMessage");
      const user = { id: "user-id" } as AuthUser;

      await controller.reportMessage(user, 123, { reason: ChatReportReason.Abuse });

      expect(reportSpy).toHaveBeenCalledWith(123, user, { reason: ChatReportReason.Abuse });
    });
  });
});
