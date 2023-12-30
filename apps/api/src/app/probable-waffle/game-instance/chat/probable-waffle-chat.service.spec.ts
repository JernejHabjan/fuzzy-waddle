import { Test, TestingModule } from "@nestjs/testing";
import { ProbableWaffleChatService } from "./probable-waffle-chat.service";
import { textSanitizationServiceStub } from "../../../../core/content-filters/text-sanitization.service.spec";
import { TextSanitizationService } from "../../../../core/content-filters/text-sanitization.service";

describe("ProbableWaffleChatService", () => {
  let service: ProbableWaffleChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProbableWaffleChatService,
        { provide: TextSanitizationService, useValue: textSanitizationServiceStub }
      ]
    }).compile();

    service = module.get<ProbableWaffleChatService>(ProbableWaffleChatService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
