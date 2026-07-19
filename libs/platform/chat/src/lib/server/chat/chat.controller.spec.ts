import { ChatService } from "./chat.service";
import { chatServiceStub } from "./chat.service.stub";
import { ChatController } from "./chat.controller";
import { ChatReportReason } from "@fuzzy-waddle/platform-database-schema";
import type { AuthUser } from "@supabase/supabase-js";

describe("ChatController", () => {
  const chatService = chatServiceStub as ChatService;
  const controller = new ChatController(chatService);

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("getMessages", () => {
    it("should return empty messages", async () => {
      const result = await controller.getMessages({ id: "user-id" } as AuthUser, { limit: 10, offset: 0 });
      expect(result).toEqual({ messages: [], total: 0, hasMore: false });
    });
  });

  describe("reportMessage", () => {
    it("should report a message for the current user", async () => {
      const reportSpy = jest.spyOn(chatService, "reportMessage");
      const user = { id: "user-id" } as AuthUser;

      await controller.reportMessage(user, 123, { reason: ChatReportReason.Abuse });

      expect(reportSpy).toHaveBeenCalledWith(123, user, { reason: ChatReportReason.Abuse });
    });
  });
});
