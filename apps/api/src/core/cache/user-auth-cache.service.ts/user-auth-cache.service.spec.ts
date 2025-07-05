import { Test, TestingModule } from "@nestjs/testing";
import { UserAuthCacheService } from "./user-auth-cache.service";
import { authUserStub } from "../../../auth/auth.service.stub";

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

  it("should set and get user", () => {
    const user = authUserStub;
    const idToken = "idToken";
    service.setUser(idToken, user);
    expect(service.getUser(idToken)).toEqual(user);
  });
});
