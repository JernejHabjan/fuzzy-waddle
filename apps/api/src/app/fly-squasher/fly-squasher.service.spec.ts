import { Test, TestingModule } from "@nestjs/testing";
import { FlySquasherService } from "./fly-squasher.service";
import { SupabaseProviderService } from "../../core/supabase-provider/supabase-provider.service";
import { supabaseProviderServiceStub } from "../../core/supabase-provider/supabase-provider.service.stub";

describe("FlySquasherService", () => {
  let service: FlySquasherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FlySquasherService, { provide: SupabaseProviderService, useValue: supabaseProviderServiceStub }]
    }).compile();

    service = module.get<FlySquasherService>(FlySquasherService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
