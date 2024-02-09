import { Test, TestingModule } from "@nestjs/testing";
import { RoomService } from "./room.service";
import { SupabaseProviderService } from "../../../core/supabase-provider/supabase-provider.service";
import { supabaseProviderServiceStub } from "../../../core/supabase-provider/supabase-provider.service.spec";

describe("RoomService", () => {
  let service: RoomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomService, { provide: SupabaseProviderService, useValue: supabaseProviderServiceStub }]
    }).compile();

    service = module.get<RoomService>(RoomService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
