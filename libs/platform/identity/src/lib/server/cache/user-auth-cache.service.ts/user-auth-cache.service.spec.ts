import { Test, TestingModule } from "@nestjs/testing";
import { UserAuthCacheService } from "./user-auth-cache.service";

describe("UserAuthCacheService", () => {
  let service: UserAuthCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserAuthCacheService]
    }).compile();

    service = module.get<UserAuthCacheService>(UserAuthCacheService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
