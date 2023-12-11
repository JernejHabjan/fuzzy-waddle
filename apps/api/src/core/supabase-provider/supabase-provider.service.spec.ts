import { Test, TestingModule } from "@nestjs/testing";
import { SupabaseProviderService } from "./supabase-provider.service";
import { ISupabaseProviderService } from "./supabase-provider.service.interface";
import { SupabaseClient } from "@supabase/supabase-js";

export const supabaseProviderServiceStub = {
  get supabaseClient(): SupabaseClient {
    return {} as SupabaseClient;
  }
} satisfies ISupabaseProviderService;

describe("SupabaseProviderService", () => {
  /**
   * https://stackoverflow.com/a/48042799/5909875
   */
  const OLD_ENV = process.env;
  let service: SupabaseProviderService;

  beforeEach(async () => {
    jest.resetModules(); // Most important - it clears the cache
    process.env = { ...OLD_ENV }; // Make a copy

    process.env.SUPABASE_URL = "http://localhost:8000";
    process.env.SUPABASE_SERVICE_KEY = "test";
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupabaseProviderService]
    }).compile();

    service = module.get<SupabaseProviderService>(SupabaseProviderService);
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
