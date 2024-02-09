import { Test, TestingModule } from "@nestjs/testing";
import { ChatService } from "./chat.service";
import { IChatService } from "./chat.service.interface";
import { AuthUser } from "@supabase/supabase-js";
import { SupabaseProviderService } from "../../core/supabase-provider/supabase-provider.service";
import { supabaseProviderServiceStub } from "../../core/supabase-provider/supabase-provider.service.spec";
import { TextSanitizationService } from "../../core/content-filters/text-sanitization.service";
import { textSanitizationServiceStub } from "../../core/content-filters/text-sanitization.service.spec";

// noinspection JSUnusedLocalSymbols
export const chatServiceStub = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  postMessage(text: string, user: AuthUser): Promise<string> {
    return Promise.resolve(text);
  }
} satisfies IChatService;

describe("ChatService", () => {
  let service: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: SupabaseProviderService, useValue: supabaseProviderServiceStub },
        { provide: TextSanitizationService, useValue: textSanitizationServiceStub }
      ]
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
