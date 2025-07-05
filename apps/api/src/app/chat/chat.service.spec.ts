import { Test, TestingModule } from "@nestjs/testing";
import { ChatService } from "./chat.service";
import { SupabaseProviderService } from "../../core/supabase-provider/supabase-provider.service";
import { supabaseProviderServiceStub } from "../../core/supabase-provider/supabase-provider.service.stub";
import { TextSanitizationService } from "../../core/content-filters/text-sanitization.service";
import { textSanitizationServiceStub } from "../../core/content-filters/text-sanitization.service.stub";

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
