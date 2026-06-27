import { Test, TestingModule } from "@nestjs/testing";
import { ChatService } from "./chat.service";
import { SupabaseProviderService } from "../../core/supabase-provider/supabase-provider.service";
import { supabaseProviderServiceStub } from "../../core/supabase-provider/supabase-provider.service.stub";
import { TextSanitizationService } from "../../core/content-filters/text-sanitization.service";
import { textSanitizationServiceStub } from "../../core/content-filters/text-sanitization.service.stub";
import { GameInstanceService } from "../probable-waffle/game-instance/game-instance.service";
import { GameInstanceServiceStub } from "../probable-waffle/game-instance/game-instance.service.stub";

describe("ChatService", () => {
  let service: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: SupabaseProviderService, useValue: supabaseProviderServiceStub },
        { provide: TextSanitizationService, useValue: textSanitizationServiceStub },
        { provide: GameInstanceService, useValue: GameInstanceServiceStub }
      ]
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
