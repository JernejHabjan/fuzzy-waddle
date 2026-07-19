import { Test, TestingModule } from "@nestjs/testing";
import { ChatService } from "./chat.service";
import { SupabaseProviderService } from "@fuzzy-waddle/platform-database-schema/server/supabase-provider/supabase-provider.service";
import { supabaseProviderServiceStub } from "@fuzzy-waddle/platform-database-schema/server/supabase-provider/supabase-provider.service.stub";
import { TextSanitizationService } from "../content-filters/text-sanitization.service";
import { textSanitizationServiceStub } from "../content-filters/text-sanitization.service.stub";
import { GameChatAccessRegistry } from "./game-chat-access-registry";

describe("ChatService", () => {
  let service: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: SupabaseProviderService, useValue: supabaseProviderServiceStub },
        { provide: TextSanitizationService, useValue: textSanitizationServiceStub },
        { provide: GameChatAccessRegistry, useValue: { ensureCanAccess: jest.fn() } }
      ]
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
